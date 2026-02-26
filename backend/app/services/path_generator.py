"""
Path generation engine.

This is the core algorithmic component of the system. It builds an ordered
sequence of Codeforces problems that forms a coherent training path.

Algorithm overview:
  1. Filter problems by requested topics.
  2. Filter by rating range [min_rating, max_rating].
  3. Exclude already-solved problems (if user handle linked).
  4. Partition remaining problems into rating bands (step = RATING_STEP).
  5. Within each band, rank problems by a composite educational score.
  6. Select problems from each band according to the mode distribution.
  7. Assemble the final ordered list.

Mode distributions:
  - LEARNING:   Heavy on lower bands, gradual ramp (60% below mid, 40% above).
  - REVISION:   Uniform sampling across the range.
  - CHALLENGE:  Heavy on upper bands, steep ramp (30% below mid, 70% above).
"""

import logging
import math
import random
from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy import and_, func as sqlfunc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.path import (
    PathMode,
    PathProblem,
    PathStatus,
    PracticePath,
    ProblemStatus,
)
from app.models.problem import Problem, Tag, problem_tags
from app.models.progress import UserProgress

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class PathConfig:
    """Parameters for path generation."""

    topics: list[str]
    min_rating: int
    max_rating: int
    mode: PathMode
    problem_count: int
    exclude_problem_ids: set[int] = field(default_factory=set)
    rating_step: int = settings.RATING_STEP

    @property
    def mid_rating(self) -> int:
        return (self.min_rating + self.max_rating) // 2


class PathGeneratorService:
    """Generates structured practice paths from the problem database."""

    async def generate_path(
        self,
        db: AsyncSession,
        config: PathConfig,
    ) -> list[Problem]:
        """
        Generate an ordered list of problems for a practice path.
        Returns a list of Problem objects in recommended order.
        """
        # Step 1: Query candidate problems
        candidates = await self._fetch_candidates(db, config)

        if not candidates:
            logger.warning(f"No candidate problems found for config: {config}")
            return []

        # Step 2: Partition into rating bands
        bands = self._partition_into_bands(candidates, config)

        # Step 3: Calculate band quotas based on mode
        quotas = self._calculate_band_quotas(bands, config)

        # Step 4: Select problems from each band
        selected = self._select_from_bands(bands, quotas, config)

        # Step 5: Final ordering (smooth difficulty progression)
        ordered = self._order_problems(selected, config)

        return ordered[: config.problem_count]

    async def create_practice_path(
        self,
        db: AsyncSession,
        user_id,
        name: str,
        description: str | None,
        config: PathConfig,
        forced_mode: bool = False,
    ) -> PracticePath:
        """
        Full pipeline: generate problems and create the PracticePath + PathProblems
        in the database.
        """
        problems = await self.generate_path(db, config)

        if not problems:
            raise ValueError("Could not generate path: no matching problems found")

        # Create the path record
        path = PracticePath(
            user_id=user_id,
            name=name,
            description=description,
            topics=config.topics,
            min_rating=config.min_rating,
            max_rating=config.max_rating,
            mode=config.mode,
            forced_mode=forced_mode,
            total_problems=len(problems),
            current_position=0,
            status=PathStatus.ACTIVE,
        )
        db.add(path)
        await db.flush()

        # Create path-problem entries
        for i, problem in enumerate(problems):
            status = ProblemStatus.UNLOCKED if i == 0 else ProblemStatus.LOCKED
            pp = PathProblem(
                path_id=path.id,
                problem_id=problem.id,
                position=i,
                status=status,
            )
            db.add(pp)

        await db.flush()
        return path

    # ── Internal Pipeline Steps ──────────────────────────────────

    async def _fetch_candidates(
        self, db: AsyncSession, config: PathConfig
    ) -> list[Problem]:
        """Query problems matching topic and rating filters."""
        # Build base query
        query = (
            select(Problem)
            .options(selectinload(Problem.tags))
            .where(
                and_(
                    Problem.rating.isnot(None),
                    Problem.rating >= config.min_rating,
                    Problem.rating <= config.max_rating,
                )
            )
        )

        # Topic filter: problems must have at least one matching tag
        if config.topics:
            topic_slugs = [t.lower().replace(" ", "-") for t in config.topics]
            query = query.join(Problem.tags).where(Tag.slug.in_(topic_slugs))

        # Exclude already-solved problems
        if config.exclude_problem_ids:
            query = query.where(Problem.id.notin_(config.exclude_problem_ids))

        # Deduplicate (join can cause duplicates)
        query = query.distinct()

        result = await db.execute(query)
        return list(result.scalars().all())

    def _partition_into_bands(
        self, problems: list[Problem], config: PathConfig
    ) -> dict[int, list[Problem]]:
        """
        Partition problems into rating bands.
        Band key = lower bound of band (e.g., 800, 900, 1000...).
        """
        bands: dict[int, list[Problem]] = {}
        step = config.rating_step

        for p in problems:
            if p.rating is None:
                continue
            band_key = (p.rating // step) * step
            if band_key not in bands:
                bands[band_key] = []
            bands[band_key].append(p)

        # Sort problems within each band by educational score
        for band_key in bands:
            bands[band_key].sort(key=lambda p: self._educational_score(p), reverse=True)

        return dict(sorted(bands.items()))

    def _calculate_band_quotas(
        self, bands: dict[int, list[Problem]], config: PathConfig
    ) -> dict[int, int]:
        """
        Calculate how many problems to pick from each band based on mode.
        """
        band_keys = sorted(bands.keys())
        n_bands = len(band_keys)

        if n_bands == 0:
            return {}

        total = config.problem_count
        quotas: dict[int, int] = {}

        if config.mode == PathMode.LEARNING:
            # Linearly decreasing weight: more problems at lower ratings
            weights = [n_bands - i for i in range(n_bands)]
        elif config.mode == PathMode.REVISION:
            # Uniform weight
            weights = [1] * n_bands
        elif config.mode == PathMode.CHALLENGE:
            # Linearly increasing weight: more problems at higher ratings
            weights = [i + 1 for i in range(n_bands)]
        else:
            weights = [1] * n_bands

        total_weight = sum(weights)

        # Distribute problems proportionally
        allocated = 0
        for i, key in enumerate(band_keys):
            count = max(1, round(total * weights[i] / total_weight))
            # Don't exceed available problems in band
            count = min(count, len(bands[key]))
            quotas[key] = count
            allocated += count

        # Adjust to hit target count
        diff = total - allocated
        if diff > 0:
            # Add more from the bands with most available
            for key in sorted(band_keys, key=lambda k: len(bands[k]), reverse=True):
                can_add = len(bands[key]) - quotas[key]
                add = min(diff, can_add)
                quotas[key] += add
                diff -= add
                if diff <= 0:
                    break
        elif diff < 0:
            # Remove from bands with most allocated
            for key in sorted(band_keys, key=lambda k: quotas[k], reverse=True):
                can_remove = quotas[key] - 1  # keep at least 1
                remove = min(-diff, can_remove)
                quotas[key] -= remove
                diff += remove
                if diff >= 0:
                    break

        return quotas

    def _select_from_bands(
        self,
        bands: dict[int, list[Problem]],
        quotas: dict[int, int],
        config: PathConfig,
    ) -> list[Problem]:
        """Select problems from each band according to quotas."""
        selected: list[Problem] = []

        for band_key, count in sorted(quotas.items()):
            available = bands.get(band_key, [])
            if not available:
                continue

            # Pick top-scored problems but add slight randomness
            # to avoid always picking the same problems
            pick_count = min(count, len(available))
            pool_size = min(pick_count * 3, len(available))
            pool = available[:pool_size]

            # Weighted random selection favoring higher educational score
            chosen = self._weighted_sample(pool, pick_count)
            selected.extend(chosen)

        return selected

    def _order_problems(
        self, problems: list[Problem], config: PathConfig
    ) -> list[Problem]:
        """
        Final ordering: smooth difficulty progression.
        Primary sort by rating, secondary by educational score (within same rating).
        Add micro-variation to avoid monotony.
        """
        # Sort primarily by rating
        problems.sort(key=lambda p: (p.rating or 0, -self._educational_score(p)))

        # Apply interleaving for variety within similar ratings
        # Group consecutive problems with same rating and shuffle within group
        ordered: list[Problem] = []
        i = 0
        while i < len(problems):
            j = i
            while j < len(problems) and problems[j].rating == problems[i].rating:
                j += 1
            group = problems[i:j]
            if len(group) > 2:
                # Light shuffle: keep general order but add variety
                mid = len(group) // 2
                first_half = group[:mid]
                second_half = group[mid:]
                random.shuffle(first_half)
                random.shuffle(second_half)
                group = first_half + second_half
            ordered.extend(group)
            i = j

        return ordered

    # ── Scoring ──────────────────────────────────────────────────

    @staticmethod
    def _educational_score(problem: Problem) -> float:
        """
        Composite score indicating how good a problem is for learning.
        Higher = better for learning.

        Factors:
          - solved_count: More solved = clearer problem statement, better editorial
          - Has rating: Rated problems are better for structured practice
          - Tag count: Problems with 2-3 tags are pedagogically rich
        """
        score = 0.0

        # Solved count (log-scaled, capped contribution)
        if problem.solved_count and problem.solved_count > 0:
            score += min(math.log10(problem.solved_count + 1) * 10, 50)

        # Has rating
        if problem.rating is not None:
            score += 20

        # Tag count sweet spot (2-3 tags is ideal)
        n_tags = len(problem.tags) if problem.tags else 0
        if n_tags == 0:
            score += 0
        elif 1 <= n_tags <= 2:
            score += 15
        elif n_tags == 3:
            score += 10
        else:
            score += 5  # Too many tags = possibly confusing

        return score

    @staticmethod
    def _weighted_sample(items: list[Problem], k: int) -> list[Problem]:
        """Weighted sampling without replacement. Weight = educational score."""
        if k >= len(items):
            return list(items)

        weights = [PathGeneratorService._educational_score(p) + 1 for p in items]
        selected: list[Problem] = []
        remaining = list(range(len(items)))

        for _ in range(k):
            total = sum(weights[i] for i in remaining)
            if total <= 0:
                break
            r = random.uniform(0, total)
            cumulative = 0
            chosen_idx = remaining[0]
            for idx in remaining:
                cumulative += weights[idx]
                if cumulative >= r:
                    chosen_idx = idx
                    break
            selected.append(items[chosen_idx])
            remaining.remove(chosen_idx)

        return selected


# Singleton
path_generator = PathGeneratorService()
