"""
AI coaching endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundException
from app.database import get_db
from app.models.problem import Problem
from app.models.user import User
from app.schemas.coaching import CoachingRequest, CoachingResponse
from app.services.coaching import coaching_service

router = APIRouter(prefix="/coaching", tags=["AI Coaching"])


@router.post("", response_model=CoachingResponse)
async def get_coaching(
    payload: CoachingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get AI coaching for a specific problem.

    Actions:
      - explain: Explain the problem statement
      - hint: Get a graded hint (level 1-5)
      - approach: Suggest possible approaches
      - pitfalls: Warn about common mistakes
      - analyze: Post-solve analysis
      - solution: Full solution (use sparingly)
    """
    # Fetch the problem
    result = await db.execute(
        select(Problem)
        .options(selectinload(Problem.tags))
        .where(Problem.id == payload.problem_id)
    )
    problem = result.scalar_one_or_none()
    if not problem:
        raise NotFoundException("Problem")

    # Get coaching response
    coaching_result = await coaching_service.get_coaching(
        problem=problem,
        action=payload.action,
        hint_level=payload.hint_level,
        user_context=payload.user_context or "",
    )

    return CoachingResponse(
        problem_id=payload.problem_id,
        action=payload.action,
        response=coaching_result["response"],
        hint_level=payload.hint_level if payload.action == "hint" else None,
        follow_up_suggestions=coaching_result["follow_up_suggestions"],
        warning=coaching_result["warning"],
    )
