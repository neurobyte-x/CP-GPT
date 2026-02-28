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


def _sql_str(value: str) -> str:
    """Escape a string for safe use in raw SQL VALUES clauses."""
    return "'" + value.replace("'", "''") + "'"


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
        Uses raw SQL bulk inserts via engine.begin() for reliability over Neon DB.
        ~11k problems in ~30-60s.
        Returns the number of problems synced.
        """
        from app.database import engine
        from sqlalchemy import text

        # Create sync log (via passed db session for audit trail)
        sync_log = CFSyncLog(sync_type="problems", status=SyncStatus.RUNNING)
        db.add(sync_log)
        await db.flush()
        sync_log_id = sync_log.id

        try:
            raw = await self.fetch_all_problems()
            problems_data = raw.get("problems", [])
            statistics_data = raw.get("problemStatistics", [])
            logger.info(f"Fetched {len(problems_data)} problems from CF API")

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

            # ── Use engine.begin() for all DB operations ──────────
            async with engine.begin() as conn:
                # ── Step 1: Bulk upsert tags ──────────────────────
                tag_map: dict[str, int] = {}
                if all_tag_names:
                    tag_values = ", ".join(
                        f"({_sql_str(name)}, {_sql_str(self._slugify(name))}, {_sql_str(self._categorize_tag(name))})"
                        for name in all_tag_names
                    )
                    result = await conn.execute(
                        text(
                            f"INSERT INTO tags (name, slug, category) VALUES {tag_values} "
                            f"ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, category = EXCLUDED.category "
                            f"RETURNING id, name"
                        )
                    )
                    tag_map = {row.name: row.id for row in result}
                logger.info(f"Upserted {len(tag_map)} tags")

                # ── Step 2: Bulk upsert problems in batches ────────
                synced = 0
                batch_size = 1000
                problem_id_map: dict[str, int] = {}

                for i in range(0, len(problems_data), batch_size):
                    batch = problems_data[i : i + batch_size]
                    rows = []
                    for p in batch:
                        contest_id = p.get("contestId")
                        index = p.get("index")
                        if not contest_id or not index:
                            continue
                        key = f"{contest_id}-{index}"
                        url = f"https://codeforces.com/problemset/problem/{contest_id}/{index}"
                        name = p.get("name", "Unknown").replace("'", "''")
                        rating = p.get("rating")
                        rating_sql = str(rating) if rating is not None else "NULL"
                        rows.append(
                            f"({contest_id}, {_sql_str(index)}, '{name}', {rating_sql}, "
                            f"{solve_counts.get(key, 0)}, {_sql_str(url)})"
                        )

                    if rows:
                        values_sql = ", ".join(rows)
                        result = await conn.execute(
                            text(
                                f"INSERT INTO problems (contest_id, problem_index, name, rating, solved_count, url) "
                                f"VALUES {values_sql} "
                                f"ON CONFLICT ON CONSTRAINT uq_problem_contest_index "
                                f"DO UPDATE SET name = EXCLUDED.name, rating = EXCLUDED.rating, solved_count = EXCLUDED.solved_count "
                                f"RETURNING id, contest_id, problem_index"
                            )
                        )
                        for row in result:
                            k = f"{row.contest_id}-{row.problem_index}"
                            problem_id_map[k] = row.id
                        synced += len(rows)

                    logger.info(f"Synced {synced}/{len(problems_data)} problems...")

                # ── Step 3: Bulk update tag associations ──────────
                all_pids = list(problem_id_map.values())
                if all_pids:
                    # Delete in chunks to avoid overly long IN clauses
                    for ci in range(0, len(all_pids), 5000):
                        chunk = all_pids[ci : ci + 5000]
                        pids_sql = ", ".join(str(pid) for pid in chunk)
                        await conn.execute(
                            text(
                                f"DELETE FROM problem_tags WHERE problem_id IN ({pids_sql})"
                            )
                        )

                # Build and insert tag associations
                tag_assoc_rows = []
                for p in problems_data:
                    contest_id = p.get("contestId")
                    index = p.get("index")
                    if not contest_id or not index:
                        continue
                    key = f"{contest_id}-{index}"
                    problem_id = problem_id_map.get(key)
                    if not problem_id:
                        continue
                    for tag_name in p.get("tags", []):
                        tag_id = tag_map.get(tag_name)
                        if tag_id:
                            tag_assoc_rows.append(f"({problem_id}, {tag_id})")

                if tag_assoc_rows:
                    for ci in range(0, len(tag_assoc_rows), 5000):
                        chunk = tag_assoc_rows[ci : ci + 5000]
                        values_sql = ", ".join(chunk)
                        await conn.execute(
                            text(
                                f"INSERT INTO problem_tags (problem_id, tag_id) VALUES {values_sql} "
                                f"ON CONFLICT DO NOTHING"
                            )
                        )
                    logger.info(f"Inserted {len(tag_assoc_rows)} tag associations")

                # Update sync log with success (while still in transaction)
                await conn.execute(
                    text(
                        f"UPDATE cf_sync_logs SET status = 'success', problems_synced = {synced}, "
                        f"completed_at = now() WHERE id = {sync_log_id}"
                    )
                )
            # Transaction commits here automatically

            logger.info(
                f"Successfully synced {synced} problems with {len(tag_assoc_rows)} tag links"
            )
            return synced

        except Exception as e:
            # Update sync log with failure
            async with engine.begin() as conn:
                error_msg = str(e)[:2000].replace("'", "''")
                await conn.execute(
                    text(
                        f"UPDATE cf_sync_logs SET status = 'failed', error_message = '{error_msg}', "
                        f"completed_at = now() WHERE id = {sync_log_id}"
                    )
                )
            logger.error(f"Problem sync failed: {e}", exc_info=True)
            raise

    # Keep old methods as unused (bulk versions above replace them)
    async def _bulk_upsert_tags(
        self, db: AsyncSession, tag_names: set[str]
    ) -> dict[str, int]:
        """Deprecated — replaced by raw SQL in sync_problems."""
        pass

    async def _bulk_upsert_problems(
        self,
        db: AsyncSession,
        problems: list[dict],
        solve_counts: dict[str, int],
        tag_map: dict[str, int],
    ) -> int:
        """Deprecated — replaced by raw SQL in sync_problems."""
        pass

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
