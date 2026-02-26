"""
Progress tracking and statistics endpoints.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func as sqlfunc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.progress import AttemptStatus, UserProgress, UserTopicStats
from app.models.user import User
from app.schemas.progress import TopicStatsResponse, UserProgressResponse

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("", response_model=list[UserProgressResponse])
async def list_progress(
    status_filter: str | None = Query(None, pattern="^(attempted|solved|gave_up)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the user's progress records."""
    query = select(UserProgress).where(UserProgress.user_id == current_user.id)

    if status_filter:
        query = query.where(UserProgress.status == AttemptStatus(status_filter))

    query = query.order_by(UserProgress.first_attempted_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/topics", response_model=list[TopicStatsResponse])
async def get_topic_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get per-topic statistics for the current user."""
    from app.models.problem import Tag

    result = await db.execute(
        select(UserTopicStats, Tag)
        .join(Tag, UserTopicStats.tag_id == Tag.id)
        .where(UserTopicStats.user_id == current_user.id)
        .order_by(UserTopicStats.problems_solved.desc())
    )

    stats = []
    for topic_stat, tag in result.all():
        stats.append(
            TopicStatsResponse(
                tag_name=tag.name,
                tag_slug=tag.slug,
                problems_solved=topic_stat.problems_solved,
                problems_attempted=topic_stat.problems_attempted,
                avg_rating_solved=topic_stat.avg_rating_solved,
                max_rating_solved=topic_stat.max_rating_solved,
                estimated_skill=topic_stat.estimated_skill,
            )
        )
    return stats


@router.get("/summary")
async def get_progress_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Quick summary of user's overall progress."""
    solved = await db.execute(
        select(sqlfunc.count()).where(
            and_(
                UserProgress.user_id == current_user.id,
                UserProgress.status == AttemptStatus.SOLVED,
            )
        )
    )
    attempted = await db.execute(
        select(sqlfunc.count()).where(UserProgress.user_id == current_user.id)
    )
    total_time = await db.execute(
        select(sqlfunc.sum(UserProgress.time_spent_seconds)).where(
            UserProgress.user_id == current_user.id
        )
    )

    return {
        "total_solved": solved.scalar_one(),
        "total_attempted": attempted.scalar_one(),
        "total_time_hours": round((total_time.scalar_one() or 0) / 3600, 1),
        "estimated_rating": current_user.estimated_rating,
    }
