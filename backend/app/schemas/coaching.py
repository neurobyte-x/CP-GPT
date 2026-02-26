"""AI Coaching schemas."""

from typing import Optional

from pydantic import BaseModel, Field


class CoachingRequest(BaseModel):
    """Request for AI coaching on a specific problem."""

    problem_id: int
    action: str = Field(
        ...,
        pattern="^(explain|hint|approach|pitfalls|analyze|solution)$",
        description=(
            "explain: Explain problem statement. "
            "hint: Give a graded hint. "
            "approach: Suggest possible approaches. "
            "pitfalls: Warn about common mistakes. "
            "analyze: Post-solve analysis. "
            "solution: Full solution (only when explicitly requested)."
        ),
    )
    hint_level: int = Field(
        1, ge=1, le=5, description="Hint specificity level (1=vague, 5=almost solution)"
    )
    user_context: Optional[str] = Field(
        None,
        max_length=2000,
        description="Additional context from the user (e.g., their current approach or where they're stuck)",
    )


class CoachingResponse(BaseModel):
    problem_id: int
    action: str
    response: str
    hint_level: Optional[int] = None
    follow_up_suggestions: list[str] = []
    warning: Optional[str] = (
        None  # e.g., "This reveals significant detail about the solution"
    )
