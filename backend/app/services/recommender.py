"""
Recommender service — deterministic problem search and ranking engine.

This is the workhorse behind the AI agent's tools. It queries the local
Codeforces problem database and returns ranked, filtered results.

Capabilities:
  - Topic-based search (single or multi-tag)
  - Rating range filtering
  - Exclude already-solved problems for a user
  - Educational ranking (popularity + rating sweet spot)
  - Similarity search (Jaccard on tags + rating proximity)
  - Weakness-targeted recommendations
"""

import logging
import math
from typing import Optional

from sqlalchemy import and_, func as sqlfunc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.problem import Problem, Tag, problem_tags
from app.models.progress import AttemptStatus, UserProgress, UserTopicStats

logger = logging.getLogger(__name__)


class RecommenderService:
    """Deterministic problem recommendation engine."""

    # ── Problem Search ───────────────────────────────────────────

    async def search_problems(
        self,
        db: AsyncSession,
        *,
        tags: Optional[list[str]] = None,
        min_rating: Optional[int] = None,
        max_rating: Optional[int] = None,
        exclude_solved_by: Optional[str] = None,  # user UUID as str
        min_solved_count: Optional[int] = None,
        search_query: Optional[str] = None,
        sort_by: str = "educational_score",  # rating, solved_count, educational_score
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        """
        Search problems with filters and educational ranking.

        Returns list of dicts with problem data + tags, ready for the agent.
        """
        query = select(Problem).options(selectinload(Problem.tags))

        # Tag filter — problem must have ALL requested tags
        if tags:
            for tag_name in tags:
                tag_subq = (
                    select(problem_tags.c.problem_id)
                    .join(Tag, Tag.id == problem_tags.c.tag_id)
                    .where(sqlfunc.lower(Tag.name) == tag_name.lower())
                )
                query = query.where(Problem.id.in_(tag_subq))

        # Rating range
        if min_rating is not None:
            query = query.where(Problem.rating >= min_rating)
        if max_rating is not None:
            query = query.where(Problem.rating <= max_rating)

        # Only rated problems (exclude unrated)
        query = query.where(Problem.rating.isnot(None))

        # Minimum solved count (proxy for problem quality)
        if min_solved_count is not None:
            query = query.where(Problem.solved_count >= min_solved_count)

        # Text search on problem name
        if search_query:
            query = query.where(Problem.name.ilike(f"%{search_query}%"))

        # Exclude solved problems
        if exclude_solved_by:
            solved_subq = select(UserProgress.problem_id).where(
                and_(
                    UserProgress.user_id == exclude_solved_by,
                    UserProgress.status == AttemptStatus.SOLVED,
                )
            )
            query = query.where(Problem.id.notin_(solved_subq))

        # Sorting
        if sort_by == "rating":
            query = query.order_by(Problem.rating.asc(), Problem.solved_count.desc())
        elif sort_by == "solved_count":
            query = query.order_by(Problem.solved_count.desc())
        elif sort_by == "educational_score":
            # Sort by: problems with moderate solve counts are better for learning
            # (very popular = too easy, very unpopular = obscure/bad)
            # Use rating ASC as primary, solved_count DESC as tiebreaker
            query = query.order_by(Problem.rating.asc(), Problem.solved_count.desc())
        else:
            query = query.order_by(Problem.rating.asc())

        # Pagination
        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        problems = result.scalars().unique().all()

        return [self._problem_to_dict(p) for p in problems]

    async def get_problem_details(
        self,
        db: AsyncSession,
        *,
        problem_id: Optional[int] = None,
        contest_id: Optional[int] = None,
        problem_index: Optional[str] = None,
    ) -> Optional[dict]:
        """Get detailed info for a specific problem."""
        query = select(Problem).options(selectinload(Problem.tags))

        if problem_id:
            query = query.where(Problem.id == problem_id)
        elif contest_id and problem_index:
            query = query.where(
                and_(
                    Problem.contest_id == contest_id,
                    Problem.problem_index == problem_index,
                )
            )
        else:
            return None

        result = await db.execute(query)
        problem = result.scalar_one_or_none()
        return self._problem_to_dict(problem) if problem else None

    async def find_similar_problems(
        self,
        db: AsyncSession,
        *,
        problem_id: int,
        exclude_solved_by: Optional[str] = None,
        limit: int = 10,
    ) -> list[dict]:
        """
        Find problems similar to a given problem.
        Similarity = Jaccard index on tags + rating proximity.
        """
        # Get the reference problem
        ref_result = await db.execute(
            select(Problem)
            .options(selectinload(Problem.tags))
            .where(Problem.id == problem_id)
        )
        ref = ref_result.scalar_one_or_none()
        if not ref:
            return []

        ref_tag_ids = {t.id for t in ref.tags}
        ref_rating = ref.rating or 1200

        # Get candidate problems with overlapping tags
        if ref_tag_ids:
            candidates_query = (
                select(Problem)
                .options(selectinload(Problem.tags))
                .where(
                    and_(
                        Problem.id != problem_id,
                        Problem.rating.isnot(None),
                        Problem.rating.between(ref_rating - 300, ref_rating + 300),
                        Problem.id.in_(
                            select(problem_tags.c.problem_id).where(
                                problem_tags.c.tag_id.in_(ref_tag_ids)
                            )
                        ),
                    )
                )
                .limit(200)  # Fetch more, rank locally
            )
        else:
            # No tags — just use rating proximity
            candidates_query = (
                select(Problem)
                .options(selectinload(Problem.tags))
                .where(
                    and_(
                        Problem.id != problem_id,
                        Problem.rating.isnot(None),
                        Problem.rating.between(ref_rating - 200, ref_rating + 200),
                    )
                )
                .limit(200)
            )

        # Exclude solved
        if exclude_solved_by:
            solved_subq = select(UserProgress.problem_id).where(
                and_(
                    UserProgress.user_id == exclude_solved_by,
                    UserProgress.status == AttemptStatus.SOLVED,
                )
            )
            candidates_query = candidates_query.where(Problem.id.notin_(solved_subq))

        result = await db.execute(candidates_query)
        candidates = result.scalars().unique().all()

        # Rank by similarity
        scored = []
        for p in candidates:
            p_tag_ids = {t.id for t in p.tags}
            # Jaccard similarity on tags
            if ref_tag_ids or p_tag_ids:
                jaccard = len(ref_tag_ids & p_tag_ids) / len(ref_tag_ids | p_tag_ids)
            else:
                jaccard = 0.0

            # Rating proximity (0-1, 1 = same rating)
            p_rating = p.rating or 1200
            rating_sim = max(0, 1 - abs(ref_rating - p_rating) / 500)

            score = 0.7 * jaccard + 0.3 * rating_sim
            scored.append((score, p))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [self._problem_to_dict(p) for _, p in scored[:limit]]

    # ── User Analysis Queries ────────────────────────────────────

    async def get_user_stats_summary(self, db: AsyncSession, user_id: str) -> dict:
        """
        Get a summary of the user's solving stats for the agent.
        """
        # Total solved/attempted
        solved_count = await db.execute(
            select(sqlfunc.count()).where(
                and_(
                    UserProgress.user_id == user_id,
                    UserProgress.status == AttemptStatus.SOLVED,
                )
            )
        )
        attempted_count = await db.execute(
            select(sqlfunc.count()).where(UserProgress.user_id == user_id)
        )

        # Rating distribution of solved
        rating_dist = await db.execute(
            select(
                ((Problem.rating / 100) * 100).label("bucket"),
                sqlfunc.count().label("cnt"),
            )
            .join(UserProgress, UserProgress.problem_id == Problem.id)
            .where(
                and_(
                    UserProgress.user_id == user_id,
                    UserProgress.status == AttemptStatus.SOLVED,
                    Problem.rating.isnot(None),
                )
            )
            .group_by("bucket")
            .order_by("bucket")
        )

        return {
            "total_solved": solved_count.scalar_one(),
            "total_attempted": attempted_count.scalar_one(),
            "rating_distribution": {
                str(int(r.bucket)): r.cnt for r in rating_dist.all()
            },
        }

    async def get_topic_strengths(self, db: AsyncSession, user_id: str) -> list[dict]:
        """
        Get per-topic skill estimates for the agent.
        Returns sorted by estimated_skill ascending (weakest first).
        """
        result = await db.execute(
            select(UserTopicStats)
            .options(selectinload(UserTopicStats.tag))
            .where(UserTopicStats.user_id == user_id)
            .order_by(UserTopicStats.estimated_skill.asc())
        )
        stats = result.scalars().all()

        return [
            {
                "topic": s.tag.name if s.tag else f"tag_{s.tag_id}",
                "estimated_skill": s.estimated_skill,
                "problems_solved": s.problems_solved,
                "problems_attempted": s.problems_attempted,
                "avg_rating_solved": round(s.avg_rating_solved),
                "max_rating_solved": s.max_rating_solved,
            }
            for s in stats
        ]

    async def get_solved_history(
        self,
        db: AsyncSession,
        user_id: str,
        *,
        limit: int = 20,
        tag_filter: Optional[str] = None,
    ) -> list[dict]:
        """
        Get recent solved problems for the user.
        Optionally filter by tag name.
        """
        query = (
            select(UserProgress, Problem)
            .join(Problem, UserProgress.problem_id == Problem.id)
            .options(selectinload(Problem.tags))
            .where(
                and_(
                    UserProgress.user_id == user_id,
                    UserProgress.status == AttemptStatus.SOLVED,
                )
            )
            .order_by(UserProgress.solved_at.desc())
        )

        if tag_filter:
            tag_subq = (
                select(problem_tags.c.problem_id)
                .join(Tag, Tag.id == problem_tags.c.tag_id)
                .where(sqlfunc.lower(Tag.name) == tag_filter.lower())
            )
            query = query.where(Problem.id.in_(tag_subq))

        query = query.limit(limit)
        result = await db.execute(query)

        return [
            {
                **self._problem_to_dict(problem),
                "solved_at": progress.solved_at.isoformat()
                if progress.solved_at
                else None,
                "attempts": progress.attempts,
            }
            for progress, problem in result.all()
        ]

    async def get_available_tags(self, db: AsyncSession) -> list[str]:
        """Get all tag names in the database."""
        result = await db.execute(select(Tag.name).order_by(Tag.name))
        return list(result.scalars().all())

    # ── Helpers ──────────────────────────────────────────────────

    def _problem_to_dict(self, p: Problem) -> dict:
        """Convert a Problem ORM object to a plain dict for the agent."""
        return {
            "id": p.id,
            "contest_id": p.contest_id,
            "problem_index": p.problem_index,
            "name": p.name,
            "rating": p.rating,
            "solved_count": p.solved_count,
            "tags": [t.name for t in p.tags] if p.tags else [],
            "url": p.url,
            "contest_name": p.contest_name,
        }


# Singleton
recommender = RecommenderService()
