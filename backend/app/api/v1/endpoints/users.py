"""
User profile and settings endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.schemas.progress import (
    DashboardStats,
    RecentSolveResponse,
    TopicStatsResponse,
)
from app.services.user_analyzer import user_analyzer

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current user's profile."""
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    update_data = payload.model_dump(exclude_unset=True)

    for field in ("password", "email", "is_active", "is_superuser", "is_verified"):
        update_data.pop(field, None)

    if "username" in update_data and update_data["username"] is not None:
        current_user.username = update_data["username"]
    if "cf_handle" in update_data:
        current_user.cf_handle = update_data["cf_handle"]
    if (
        "estimated_rating" in update_data
        and update_data["estimated_rating"] is not None
    ):
        current_user.estimated_rating = update_data["estimated_rating"]

    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.post("/me/sync-cf")
async def sync_codeforces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sync the current user's Codeforces data (submissions, rating, etc.)."""
    result = await user_analyzer.sync_user_cf_data(db, current_user)
    return result


@router.get("/me/dashboard", response_model=DashboardStats)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard statistics for the current user."""
    data = await user_analyzer.get_dashboard_data(db, current_user)

    enriched_topics = []
    for item in data.get("topic_stats", []):
        if isinstance(item, TopicStatsResponse):
            enriched_topics.append(item)
            continue

        tag = getattr(item, "tag", None)
        tag_name = getattr(tag, "name", None) or "Unknown"
        tag_slug = getattr(tag, "slug", None) or str(getattr(item, "tag_id", "unknown"))

        enriched_topics.append(
            TopicStatsResponse(
                tag_name=tag_name,
                tag_slug=tag_slug,
                problems_solved=getattr(item, "problems_solved", 0),
                problems_attempted=getattr(item, "problems_attempted", 0),
                avg_rating_solved=float(getattr(item, "avg_rating_solved", 0.0) or 0.0),
                max_rating_solved=getattr(item, "max_rating_solved", 0),
                estimated_skill=getattr(item, "estimated_skill", 800),
            )
        )

    enriched_solves = []
    for item in data.get("recent_solves", []):
        if hasattr(item, '__len__') and len(item) == 2:
            progress, problem = item
            enriched_solves.append(RecentSolveResponse(
                id=progress.id,
                problem_id=progress.problem_id,
                problem_name=problem.name if problem else "",
                contest_id=problem.contest_id if problem else None,
                problem_index=problem.problem_index if problem else None,
                status=progress.status.value if hasattr(progress.status, 'value') else progress.status,
                attempts=progress.attempts,
                time_spent_seconds=progress.time_spent_seconds,
                hints_used=progress.hints_used,
                cf_verdict=progress.cf_verdict,
                first_attempted_at=progress.first_attempted_at,
                solved_at=progress.solved_at,
            ))
        else:
            enriched_solves.append(item)

    data["topic_stats"] = enriched_topics
    data["recent_solves"] = enriched_solves
    return DashboardStats(**data)


@router.get("/me/weak-topics")
async def get_weak_topics(
    top_n: int = 5,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's weakest topics for targeted practice."""
    return await user_analyzer.get_weak_topics(db, current_user.id, top_n)
