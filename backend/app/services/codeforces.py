"""
Codeforces API integration service.
Handles fetching, parsing, and caching of CF data.

API endpoints used:
  - problemset.problems     → all problems with tags and ratings
  - user.status             → user submissions
  - user.info               → user profile info
  - user.rating             → user rating changes
  - contest.list            → contest metadata
"""

import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.exceptions import ExternalAPIException
from app.models.problem import Problem, Tag, problem_tags
from app.models.progress import CFSyncLog, SyncStatus

logger = logging.getLogger(__name__)
settings = get_settings()


class CodeforcesService:
    """
    Service layer for all Codeforces API interactions.
    Implements rate limiting and error handling.
    """

    BASE_URL = settings.CF_API_BASE_URL
    REQUEST_DELAY = settings.CF_REQUEST_DELAY_SECONDS

    def __init__(self):
        self._last_request_time: float = 0
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                headers={"User-Agent": "CP-Path-Builder/1.0"},
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _rate_limited_get(self, url: str, params: dict | None = None) -> Any:
        """Make a rate-limited GET request to the CF API."""
        now = asyncio.get_event_loop().time()
        elapsed = now - self._last_request_time
        if elapsed < self.REQUEST_DELAY:
            await asyncio.sleep(self.REQUEST_DELAY - elapsed)

        client = await self._get_client()
        try:
            response = await client.get(url, params=params)
            self._last_request_time = asyncio.get_event_loop().time()
            response.raise_for_status()
            data = response.json()

            if data.get("status") != "OK":
                comment = data.get("comment", "Unknown error")
                raise ExternalAPIException("Codeforces", comment)

            return data["result"]
        except httpx.HTTPStatusError as e:
            raise ExternalAPIException("Codeforces", f"HTTP {e.response.status_code}")
        except httpx.RequestError as e:
            raise ExternalAPIException("Codeforces", str(e))

    # ── Public API Methods ───────────────────────────────────────

    async def fetch_all_problems(self) -> dict[str, Any]:
        """Fetch the complete problem set from Codeforces."""
        url = f"{self.BASE_URL}/problemset.problems"
        result = await self._rate_limited_get(url)
        return result  # {"problems": [...], "problemStatistics": [...]}

    async def fetch_user_info(self, handle: str) -> dict:
        """Fetch user profile info."""
        url = f"{self.BASE_URL}/user.info"
        result = await self._rate_limited_get(url, params={"handles": handle})
        if result:
            return result[0]
        raise ExternalAPIException("Codeforces", f"User {handle} not found")

    async def fetch_user_submissions(
        self, handle: str, count: int = 10000
    ) -> list[dict[str, Any]]:
        """Fetch user submissions (most recent first)."""
        url = f"{self.BASE_URL}/user.status"
        return await self._rate_limited_get(
            url, params={"handle": handle, "from": 1, "count": count}
        )

    async def fetch_user_rating_history(self, handle: str) -> list[dict[str, Any]]:
        """Fetch user rating changes over time."""
        url = f"{self.BASE_URL}/user.rating"
        return await self._rate_limited_get(url, params={"handle": handle})

    async def fetch_contest_list(self, gym: bool = False) -> list[dict[str, Any]]:
        """Fetch all contests."""
        url = f"{self.BASE_URL}/contest.list"
        return await self._rate_limited_get(url, params={"gym": gym})

    # ── Data Synchronization ─────────────────────────────────────

    async def sync_problems(self, db: AsyncSession) -> int:
        """
        Synchronize all Codeforces problems into local database.
        Uses upsert (INSERT ... ON CONFLICT UPDATE) for idempotency.
        Returns the number of problems synced.
        """
        # Create sync log
        sync_log = CFSyncLog(sync_type="problems", status=SyncStatus.RUNNING)
        db.add(sync_log)
        await db.flush()

        try:
            raw = await self.fetch_all_problems()
            problems_data = raw.get("problems", [])
            statistics_data = raw.get("problemStatistics", [])

            # Build solve count lookup
            solve_counts: dict[str, int] = {}
            for stat in statistics_data:
                key = f"{stat['contestId']}-{stat['index']}"
                solve_counts[key] = stat.get("solvedCount", 0)

            # Collect all unique tags
            all_tag_names: set[str] = set()
            for p in problems_data:
                for tag_name in p.get("tags", []):
                    all_tag_names.add(tag_name)

            # Upsert tags
            tag_map = await self._upsert_tags(db, all_tag_names)

            # Upsert problems in batches
            synced = 0
            batch_size = 500
            for i in range(0, len(problems_data), batch_size):
                batch = problems_data[i : i + batch_size]
                synced += await self._upsert_problem_batch(
                    db, batch, solve_counts, tag_map
                )
                await db.flush()

            sync_log.status = SyncStatus.SUCCESS
            sync_log.problems_synced = synced
            sync_log.completed_at = datetime.now(timezone.utc)
            logger.info(f"Successfully synced {synced} problems")
            return synced

        except Exception as e:
            sync_log.status = SyncStatus.FAILED
            sync_log.error_message = str(e)[:2000]
            sync_log.completed_at = datetime.now(timezone.utc)
            logger.error(f"Problem sync failed: {e}")
            raise

    async def _upsert_tags(
        self, db: AsyncSession, tag_names: set[str]
    ) -> dict[str, int]:
        """Upsert tags and return name -> id mapping."""
        tag_map: dict[str, int] = {}

        for name in tag_names:
            slug = self._slugify(name)
            category = self._categorize_tag(name)

            stmt = (
                pg_insert(Tag)
                .values(name=name, slug=slug, category=category)
                .on_conflict_do_update(
                    index_elements=["name"],
                    set_={"slug": slug, "category": category},
                )
                .returning(Tag.id)
            )
            result = await db.execute(stmt)
            tag_id = result.scalar_one()
            tag_map[name] = tag_id

        return tag_map

    async def _upsert_problem_batch(
        self,
        db: AsyncSession,
        problems: list[dict],
        solve_counts: dict[str, int],
        tag_map: dict[str, int],
    ) -> int:
        """Upsert a batch of problems and their tag associations."""
        synced = 0

        for p in problems:
            contest_id = p.get("contestId")
            index = p.get("index")
            if not contest_id or not index:
                continue

            key = f"{contest_id}-{index}"
            url = f"https://codeforces.com/problemset/problem/{contest_id}/{index}"

            stmt = (
                pg_insert(Problem)
                .values(
                    contest_id=contest_id,
                    problem_index=index,
                    name=p.get("name", "Unknown"),
                    rating=p.get("rating"),
                    solved_count=solve_counts.get(key, 0),
                    url=url,
                )
                .on_conflict_do_update(
                    constraint="uq_problem_contest_index",
                    set_={
                        "name": p.get("name", "Unknown"),
                        "rating": p.get("rating"),
                        "solved_count": solve_counts.get(key, 0),
                    },
                )
                .returning(Problem.id)
            )
            result = await db.execute(stmt)
            problem_id = result.scalar_one()

            # Update tag associations
            tag_names = p.get("tags", [])
            if tag_names:
                # Delete existing associations and re-insert
                await db.execute(
                    problem_tags.delete().where(problem_tags.c.problem_id == problem_id)
                )
                for tag_name in tag_names:
                    if tag_name in tag_map:
                        await db.execute(
                            pg_insert(problem_tags)
                            .values(problem_id=problem_id, tag_id=tag_map[tag_name])
                            .on_conflict_do_nothing()
                        )

            synced += 1

        return synced

    async def get_user_solved_problems(self, handle: str) -> set[str]:
        """
        Get set of problem IDs (e.g., "1920A") that the user has solved (AC verdict).
        """
        submissions = await self.fetch_user_submissions(handle)
        solved = set()
        for sub in submissions:
            if sub.get("verdict") == "OK":
                problem = sub.get("problem", {})
                contest_id = problem.get("contestId")
                index = problem.get("index")
                if contest_id and index:
                    solved.add(f"{contest_id}{index}")
        return solved

    # ── Helpers ──────────────────────────────────────────────────

    @staticmethod
    def _slugify(name: str) -> str:
        """Convert tag name to slug: 'two pointers' -> 'two-pointers'"""
        slug = name.lower().strip()
        slug = re.sub(r"[^a-z0-9]+", "-", slug)
        return slug.strip("-")

    @staticmethod
    def _categorize_tag(name: str) -> str:
        """Heuristic categorization of CF tags."""
        ds_tags = {
            "data structures",
            "trees",
            "dsu",
            "graphs",
            "hashing",
            "strings",
        }
        math_tags = {
            "math",
            "number theory",
            "combinatorics",
            "geometry",
            "probabilities",
            "matrices",
        }
        algo_tags = {
            "dp",
            "greedy",
            "binary search",
            "sortings",
            "divide and conquer",
            "two pointers",
            "dfs and similar",
            "bfs",
            "shortest paths",
            "brute force",
            "constructive algorithms",
            "implementation",
            "bitmasks",
            "flows",
            "games",
            "ternary search",
        }
        lower = name.lower()
        if lower in ds_tags:
            return "data_structures"
        elif lower in math_tags:
            return "math"
        elif lower in algo_tags:
            return "algorithms"
        else:
            return "other"


# Singleton-ish for reuse
cf_service = CodeforcesService()
