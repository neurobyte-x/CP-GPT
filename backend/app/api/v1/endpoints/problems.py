"""
Problem browsing and search endpoints.
"""

import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func as sqlfunc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_optional_user
from app.database import get_db
from app.models.problem import Problem, Tag, problem_tags
from app.models.progress import AttemptStatus, UserProgress
from app.models.user import User
from app.schemas.problem import (
    ProblemFilters,
    ProblemListResponse,
    ProblemResponse,
    TagResponse,
)

router = APIRouter(prefix="/problems", tags=["Problems"])


@router.get("", response_model=ProblemListResponse)
async def list_problems(
    tags: Optional[str] = Query(None, description="Comma-separated tag slugs"),
    min_rating: Optional[int] = Query(None, ge=800, le=3500),
    max_rating: Optional[int] = Query(None, ge=800, le=3500),
    search: Optional[str] = Query(None, max_length=200),
    exclude_solved: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("rating", pattern="^(rating|solved_count|contest_id|name)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Browse and filter the problem database."""
    query = select(Problem).options(selectinload(Problem.tags))

    # Tag filter
    if tags:
        tag_slugs = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_slugs:
            query = query.join(Problem.tags).where(Tag.slug.in_(tag_slugs))

    # Rating filter
    if min_rating is not None:
        query = query.where(Problem.rating >= min_rating)
    if max_rating is not None:
        query = query.where(Problem.rating <= max_rating)

    # Text search
    if search:
        query = query.where(
            or_(
                Problem.name.ilike(f"%{search}%"),
                Problem.contest_id.cast(str).contains(search),
            )
        )

    # Exclude solved problems for authenticated users
    if exclude_solved and current_user:
        solved_subq = (
            select(UserProgress.problem_id)
            .where(
                and_(
                    UserProgress.user_id == current_user.id,
                    UserProgress.status == AttemptStatus.SOLVED,
                )
            )
            .scalar_subquery()
        )
        query = query.where(Problem.id.notin_(solved_subq))

    # Deduplicate
    query = query.distinct()

    # Count total
    count_query = select(sqlfunc.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Sorting
    sort_column = getattr(Problem, sort_by, Problem.rating)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc().nulls_last())
    else:
        query = query.order_by(sort_column.asc().nulls_last())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    problems = result.scalars().unique().all()

    return ProblemListResponse(
        problems=[ProblemResponse.model_validate(p) for p in problems],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/tags", response_model=list[TagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)):
    """Get all available tags with problem counts."""
    result = await db.execute(
        select(
            Tag,
            sqlfunc.count(problem_tags.c.problem_id).label("problem_count"),
        )
        .outerjoin(problem_tags, Tag.id == problem_tags.c.tag_id)
        .group_by(Tag.id)
        .order_by(sqlfunc.count(problem_tags.c.problem_id).desc())
    )
    tags = []
    for row in result.all():
        tag = row[0]
        count = row[1]
        tag_resp = TagResponse.model_validate(tag)
        tag_resp.problem_count = count
        tags.append(tag_resp)
    return tags


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single problem by ID."""
    result = await db.execute(
        select(Problem)
        .options(selectinload(Problem.tags))
        .where(Problem.id == problem_id)
    )
    problem = result.scalar_one_or_none()
    if not problem:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Problem")
    return problem
