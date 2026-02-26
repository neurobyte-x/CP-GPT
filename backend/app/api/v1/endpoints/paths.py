"""
Practice path endpoints: create, list, detail, update progress.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.database import get_db
from app.models.path import (
    PathMode,
    PathProblem,
    PathStatus,
    PracticePath,
    ProblemStatus,
)
from app.models.progress import AttemptStatus, UserProgress
from app.models.user import User
from app.schemas.path import (
    MarkSolvedRequest,
    PathCreateRequest,
    PathDetailResponse,
    PathListResponse,
    PathProblemResponse,
    PathResponse,
    PathUpdateRequest,
)
from app.services.path_generator import PathConfig, path_generator
from app.services.user_analyzer import user_analyzer

router = APIRouter(prefix="/paths", tags=["Practice Paths"])


@router.post("", response_model=PathResponse, status_code=status.HTTP_201_CREATED)
async def create_path(
    payload: PathCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate and create a new practice path."""
    if payload.min_rating > payload.max_rating:
        raise BadRequestException("min_rating must be <= max_rating")

    # Get solved problem IDs for exclusion
    exclude_ids = await user_analyzer.get_user_solved_problem_ids(db, current_user.id)

    config = PathConfig(
        topics=payload.topics,
        min_rating=payload.min_rating,
        max_rating=payload.max_rating,
        mode=PathMode(payload.mode),
        problem_count=payload.problem_count,
        exclude_problem_ids=exclude_ids,
    )

    description = (
        f"{payload.mode.capitalize()} path for {', '.join(payload.topics)} "
        f"({payload.min_rating}-{payload.max_rating})"
    )

    try:
        path = await path_generator.create_practice_path(
            db=db,
            user_id=current_user.id,
            name=payload.name,
            description=description,
            config=config,
            forced_mode=payload.forced_mode,
        )
    except ValueError as e:
        raise BadRequestException(str(e))

    await db.refresh(path)
    resp = PathResponse.model_validate(path)
    resp.progress_pct = path.progress_pct
    return resp


@router.get("", response_model=PathListResponse)
async def list_paths(
    status_filter: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all practice paths for the current user."""
    query = select(PracticePath).where(PracticePath.user_id == current_user.id)

    if status_filter:
        try:
            ps = PathStatus(status_filter)
            query = query.where(PracticePath.status == ps)
        except ValueError:
            pass

    query = query.order_by(PracticePath.updated_at.desc())
    result = await db.execute(query)
    paths = result.scalars().all()

    return PathListResponse(
        paths=[PathResponse.model_validate(p) for p in paths],
        total=len(paths),
    )


@router.get("/{path_id}", response_model=PathDetailResponse)
async def get_path(
    path_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed view of a practice path including all problems."""
    result = await db.execute(
        select(PracticePath)
        .options(
            selectinload(PracticePath.path_problems).selectinload(PathProblem.problem)
        )
        .where(
            and_(
                PracticePath.id == path_id,
                PracticePath.user_id == current_user.id,
            )
        )
    )
    path = result.scalar_one_or_none()
    if not path:
        raise NotFoundException("Practice path")

    resp = PathDetailResponse.model_validate(path)
    resp.progress_pct = path.progress_pct
    resp.problems = [
        PathProblemResponse.model_validate(pp) for pp in path.path_problems
    ]
    return resp


@router.patch("/{path_id}", response_model=PathResponse)
async def update_path(
    path_id: uuid.UUID,
    payload: PathUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update path name or status."""
    result = await db.execute(
        select(PracticePath).where(
            and_(
                PracticePath.id == path_id,
                PracticePath.user_id == current_user.id,
            )
        )
    )
    path = result.scalar_one_or_none()
    if not path:
        raise NotFoundException("Practice path")

    if payload.name is not None:
        path.name = payload.name
    if payload.status is not None:
        path.status = PathStatus(payload.status)

    await db.flush()
    await db.refresh(path)
    return path


@router.delete("/{path_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_path(
    path_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a practice path."""
    result = await db.execute(
        select(PracticePath).where(
            and_(
                PracticePath.id == path_id,
                PracticePath.user_id == current_user.id,
            )
        )
    )
    path = result.scalar_one_or_none()
    if not path:
        raise NotFoundException("Practice path")

    await db.delete(path)


@router.post("/{path_id}/solve")
async def mark_problem_solved(
    path_id: uuid.UUID,
    payload: MarkSolvedRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a problem in a path as solved.
    In forced mode, this unlocks the next problem.
    """
    # Verify path ownership
    result = await db.execute(
        select(PracticePath)
        .options(selectinload(PracticePath.path_problems))
        .where(
            and_(
                PracticePath.id == path_id,
                PracticePath.user_id == current_user.id,
            )
        )
    )
    path = result.scalar_one_or_none()
    if not path:
        raise NotFoundException("Practice path")

    if path.status != PathStatus.ACTIVE:
        raise BadRequestException("Path is not active")

    # Find the path problem entry
    path_problem = None
    for pp in path.path_problems:
        if pp.problem_id == payload.problem_id:
            path_problem = pp
            break

    if not path_problem:
        raise NotFoundException("Problem not found in this path")

    if path.forced_mode and path_problem.status == ProblemStatus.LOCKED:
        raise BadRequestException(
            "This problem is locked. Solve the previous problem first."
        )

    # Mark as solved
    path_problem.status = ProblemStatus.SOLVED
    path_problem.solved_at = datetime.now(timezone.utc)

    # Update path position
    solved_count = sum(
        1 for pp in path.path_problems if pp.status == ProblemStatus.SOLVED
    )
    path.current_position = solved_count

    # Unlock next problem in forced mode
    if path.forced_mode:
        next_pos = path_problem.position + 1
        for pp in path.path_problems:
            if pp.position == next_pos and pp.status == ProblemStatus.LOCKED:
                pp.status = ProblemStatus.UNLOCKED
                pp.unlocked_at = datetime.now(timezone.utc)
                break

    # Check path completion
    if solved_count >= path.total_problems:
        path.status = PathStatus.COMPLETED
        path.completed_at = datetime.now(timezone.utc)

    # Upsert user progress record
    progress_result = await db.execute(
        select(UserProgress).where(
            and_(
                UserProgress.user_id == current_user.id,
                UserProgress.problem_id == payload.problem_id,
            )
        )
    )
    progress = progress_result.scalar_one_or_none()
    if progress:
        progress.status = AttemptStatus.SOLVED
        progress.solved_at = datetime.now(timezone.utc)
        progress.time_spent_seconds += payload.time_spent_seconds
        progress.hints_used = max(progress.hints_used, payload.hints_used)
    else:
        progress = UserProgress(
            user_id=current_user.id,
            problem_id=payload.problem_id,
            status=AttemptStatus.SOLVED,
            solved_at=datetime.now(timezone.utc),
            time_spent_seconds=payload.time_spent_seconds,
            hints_used=payload.hints_used,
        )
        db.add(progress)

    return {
        "message": "Problem marked as solved",
        "path_progress": path.progress_pct,
        "path_status": path.status.value,
        "next_unlocked": path_problem.position + 1 if path.forced_mode else None,
    }


@router.post("/{path_id}/skip/{position}")
async def skip_problem(
    path_id: uuid.UUID,
    position: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Skip a problem in a path. In forced mode, skipping costs more
    and still unlocks the next problem.
    """
    result = await db.execute(
        select(PracticePath)
        .options(selectinload(PracticePath.path_problems))
        .where(
            and_(
                PracticePath.id == path_id,
                PracticePath.user_id == current_user.id,
            )
        )
    )
    path = result.scalar_one_or_none()
    if not path:
        raise NotFoundException("Practice path")

    path_problem = None
    for pp in path.path_problems:
        if pp.position == position:
            path_problem = pp
            break

    if not path_problem:
        raise NotFoundException("Problem at this position")

    if path.forced_mode and path_problem.status == ProblemStatus.LOCKED:
        raise BadRequestException("Cannot skip a locked problem")

    path_problem.status = ProblemStatus.SKIPPED

    # Unlock next in forced mode
    if path.forced_mode:
        next_pos = position + 1
        for pp in path.path_problems:
            if pp.position == next_pos and pp.status == ProblemStatus.LOCKED:
                pp.status = ProblemStatus.UNLOCKED
                pp.unlocked_at = datetime.now(timezone.utc)
                break

    return {"message": "Problem skipped", "position": position}
