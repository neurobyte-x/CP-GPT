"""
User analysis and personalization service.

Analyzes a user's Codeforces profile and submission history to:
  - Estimate current skill level per topic
  - Identify strengths and weaknesses
  - Determine solved problems for exclusion
  - Recommend focus areas
"""

import logging
import math
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import and_, func as sqlfunc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.path import PracticePath, PathStatus
from app.models.problem import Problem, Tag, problem_tags
from app.models.progress import AttemptStatus, UserProgress, UserTopicStats
from app.models.user import User
from app.services.codeforces import cf_service

logger = logging.getLogger(__name__)


class UserAnalyzerService:
    """Analyzes user profile and provides personalization data."""

    async def sync_user_cf_data(self, db: AsyncSession, user: User) -> dict:
        """
        Full sync of a user's Codeforces data.
        Returns a summary of the sync.
        """
        if not user.cf_handle:
            return {"error": "No Codeforces handle linked"}

        summary = {
            "handle": user.cf_handle,
            "problems_synced": 0,
            "rating_updated": False,
            "topic_stats_updated": False,
        }

        try:
            # 1. Fetch user info from CF
            cf_info = await cf_service.fetch_user_info(user.cf_handle)
            user.estimated_rating = cf_info.get("rating")
            user.cf_max_rating = cf_info.get("maxRating")
            user.cf_last_synced = datetime.now(timezone.utc)
            summary["rating_updated"] = True

            # 2. Fetch and process submissions
            submissions = await cf_service.fetch_user_submissions(user.cf_handle)
            synced = await self._process_submissions(db, user, submissions)
            summary["problems_synced"] = synced

            # 3. Recalculate topic stats
            await self._recalculate_topic_stats(db, user)
            summary["topic_stats_updated"] = True

        except Exception as e:
            logger.error(f"Error syncing CF data for {user.cf_handle}: {e}")
            summary["error"] = str(e)

        return summary

    async def _process_submissions(
        self, db: AsyncSession, user: User, submissions: list[dict]
    ) -> int:
        """
        Process CF submissions into UserProgress records.
        Only tracks best verdict per problem.
        """
        # Group submissions by problem
        best_per_problem: dict[str, dict] = {}
        for sub in submissions:
            problem = sub.get("problem", {})
            contest_id = problem.get("contestId")
            index = problem.get("index")
            if not contest_id or not index:
                continue

            key = f"{contest_id}-{index}"
            verdict = sub.get("verdict", "")

            if key not in best_per_problem:
                best_per_problem[key] = sub
            elif verdict == "OK" and best_per_problem[key].get("verdict") != "OK":
                best_per_problem[key] = sub

        # Look up local problem IDs
        synced = 0
        for key, sub in best_per_problem.items():
            problem = sub.get("problem", {})
            contest_id = problem.get("contestId")
            index = problem.get("index")

            # Find local problem
            result = await db.execute(
                select(Problem).where(
                    and_(
                        Problem.contest_id == contest_id,
                        Problem.problem_index == index,
                    )
                )
            )
            local_problem = result.scalar_one_or_none()
            if not local_problem:
                continue

            # Upsert progress
            result = await db.execute(
                select(UserProgress).where(
                    and_(
                        UserProgress.user_id == user.id,
                        UserProgress.problem_id == local_problem.id,
                    )
                )
            )
            existing = result.scalar_one_or_none()

            verdict = sub.get("verdict", "")
            status = (
                AttemptStatus.SOLVED if verdict == "OK" else AttemptStatus.ATTEMPTED
            )

            if existing:
                if (
                    status == AttemptStatus.SOLVED
                    and existing.status != AttemptStatus.SOLVED
                ):
                    existing.status = status
                    existing.cf_verdict = verdict
                    existing.solved_at = datetime.now(timezone.utc)
                existing.attempts += 1
            else:
                progress = UserProgress(
                    user_id=user.id,
                    problem_id=local_problem.id,
                    status=status,
                    cf_verdict=verdict,
                    solved_at=datetime.now(timezone.utc)
                    if status == AttemptStatus.SOLVED
                    else None,
                )
                db.add(progress)
                synced += 1

        return synced

    async def _recalculate_topic_stats(self, db: AsyncSession, user: User) -> None:
        """
        Recalculate per-topic statistics for a user based on their progress records.
        """
        # Get all solved problems with their tags
        result = await db.execute(
            select(UserProgress, Problem)
            .join(Problem, UserProgress.problem_id == Problem.id)
            .where(
                and_(
                    UserProgress.user_id == user.id,
                    UserProgress.status == AttemptStatus.SOLVED,
                )
            )
        )
        rows = result.all()

        # Aggregate by tag
        tag_stats: dict[int, dict] = defaultdict(
            lambda: {
                "solved": 0,
                "attempted": 0,
                "ratings": [],
                "max_rating": 0,
            }
        )

        for progress, problem in rows:
            if problem.tags:
                for tag in problem.tags:
                    stats = tag_stats[tag.id]
                    stats["solved"] += 1
                    if problem.rating:
                        stats["ratings"].append(problem.rating)
                        stats["max_rating"] = max(stats["max_rating"], problem.rating)

        # Count attempted but unsolved
        attempted_result = await db.execute(
            select(UserProgress, Problem)
            .join(Problem, UserProgress.problem_id == Problem.id)
            .where(
                and_(
                    UserProgress.user_id == user.id,
                    UserProgress.status == AttemptStatus.ATTEMPTED,
                )
            )
        )
        for progress, problem in attempted_result.all():
            if problem.tags:
                for tag in problem.tags:
                    tag_stats[tag.id]["attempted"] += 1

        # Upsert topic stats
        for tag_id, stats in tag_stats.items():
            avg_rating = (
                sum(stats["ratings"]) / len(stats["ratings"]) if stats["ratings"] else 0
            )
            estimated_skill = self._estimate_topic_skill(stats["ratings"])

            result = await db.execute(
                select(UserTopicStats).where(
                    and_(
                        UserTopicStats.user_id == user.id,
                        UserTopicStats.tag_id == tag_id,
                    )
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                existing.problems_solved = stats["solved"]
                existing.problems_attempted = stats["attempted"]
                existing.avg_rating_solved = avg_rating
                existing.max_rating_solved = stats["max_rating"]
                existing.estimated_skill = estimated_skill
            else:
                topic_stat = UserTopicStats(
                    user_id=user.id,
                    tag_id=tag_id,
                    problems_solved=stats["solved"],
                    problems_attempted=stats["attempted"],
                    avg_rating_solved=avg_rating,
                    max_rating_solved=stats["max_rating"],
                    estimated_skill=estimated_skill,
                )
                db.add(topic_stat)

    def _estimate_topic_skill(self, ratings: list[int]) -> int:
        """
        Estimate a user's skill in a topic based on solved problem ratings.

        Uses a weighted approach:
          - Recent solves (higher indices) count more (we assume ratings list is
            in insertion order, roughly chronological).
          - The 75th percentile of solved ratings is a good baseline.
          - Add a bonus based on volume solved.
        """
        if not ratings:
            return 800

        sorted_ratings = sorted(ratings)
        n = len(sorted_ratings)

        # 75th percentile
        p75_idx = min(int(n * 0.75), n - 1)
        baseline = sorted_ratings[p75_idx]

        # Volume bonus: log-scaled, max +200
        volume_bonus = min(int(math.log(n + 1) * 40), 200)

        # Consistency bonus: if max is much higher than median, skill is volatile
        median = sorted_ratings[n // 2]
        max_rating = sorted_ratings[-1]
        consistency_penalty = max(0, (max_rating - median) // 4)

        estimated = baseline + volume_bonus - consistency_penalty
        # Clamp to valid rating range
        return max(800, min(3500, estimated))

    async def get_user_solved_problem_ids(self, db: AsyncSession, user_id) -> set[int]:
        """Get set of local problem IDs that the user has solved."""
        result = await db.execute(
            select(UserProgress.problem_id).where(
                and_(
                    UserProgress.user_id == user_id,
                    UserProgress.status == AttemptStatus.SOLVED,
                )
            )
        )
        return set(result.scalars().all())

    async def get_dashboard_data(self, db: AsyncSession, user: User) -> dict:
        """Compile dashboard statistics for a user."""
        # Total solved
        solved_count = await db.execute(
            select(sqlfunc.count()).where(
                and_(
                    UserProgress.user_id == user.id,
                    UserProgress.status == AttemptStatus.SOLVED,
                )
            )
        )
        total_solved = solved_count.scalar_one()

        # Total attempted
        attempted_count = await db.execute(
            select(sqlfunc.count()).where(UserProgress.user_id == user.id)
        )
        total_attempted = attempted_count.scalar_one()

        # Total time spent
        time_result = await db.execute(
            select(sqlfunc.sum(UserProgress.time_spent_seconds)).where(
                UserProgress.user_id == user.id
            )
        )
        total_time_seconds = time_result.scalar_one() or 0

        # Active and completed paths
        active_paths_count = await db.execute(
            select(sqlfunc.count()).where(
                and_(
                    PracticePath.user_id == user.id,
                    PracticePath.status == PathStatus.ACTIVE,
                )
            )
        )
        completed_paths_count = await db.execute(
            select(sqlfunc.count()).where(
                and_(
                    PracticePath.user_id == user.id,
                    PracticePath.status == PathStatus.COMPLETED,
                )
            )
        )

        # Topic stats
        topic_stats_result = await db.execute(
            select(UserTopicStats)
            .where(UserTopicStats.user_id == user.id)
            .order_by(UserTopicStats.problems_solved.desc())
        )
        topic_stats = topic_stats_result.scalars().all()

        # Rating distribution of solved problems
        rating_dist_result = await db.execute(
            select(
                ((Problem.rating / 100) * 100).label("bucket"),
                sqlfunc.count().label("count"),
            )
            .join(UserProgress, UserProgress.problem_id == Problem.id)
            .where(
                and_(
                    UserProgress.user_id == user.id,
                    UserProgress.status == AttemptStatus.SOLVED,
                    Problem.rating.isnot(None),
                )
            )
            .group_by("bucket")
            .order_by("bucket")
        )
        rating_distribution = {
            str(row.bucket): row.count for row in rating_dist_result.all()
        }

        # Recent solves (last 10)
        recent_result = await db.execute(
            select(UserProgress)
            .where(
                and_(
                    UserProgress.user_id == user.id,
                    UserProgress.status == AttemptStatus.SOLVED,
                )
            )
            .order_by(UserProgress.solved_at.desc())
            .limit(10)
        )
        recent_solves = recent_result.scalars().all()

        return {
            "total_problems_solved": total_solved,
            "total_problems_attempted": total_attempted,
            "total_time_spent_hours": round(total_time_seconds / 3600, 1),
            "active_paths": active_paths_count.scalar_one(),
            "completed_paths": completed_paths_count.scalar_one(),
            "current_streak_days": 0,  # TODO: calculate from daily activity
            "estimated_rating": user.estimated_rating,
            "topic_stats": topic_stats,
            "recent_solves": recent_solves,
            "rating_distribution": rating_distribution,
        }

    async def get_weak_topics(
        self, db: AsyncSession, user_id, top_n: int = 5
    ) -> list[dict]:
        """
        Identify the user's weakest topics — candidates for focused practice.
        Weakness = low estimated_skill relative to overall skill, or few problems solved
        in a topic with many available.
        """
        result = await db.execute(
            select(UserTopicStats)
            .where(UserTopicStats.user_id == user_id)
            .order_by(UserTopicStats.estimated_skill.asc())
            .limit(top_n)
        )
        weak = result.scalars().all()
        return [
            {
                "tag_id": s.tag_id,
                "estimated_skill": s.estimated_skill,
                "problems_solved": s.problems_solved,
            }
            for s in weak
        ]


# Singleton
user_analyzer = UserAnalyzerService()
