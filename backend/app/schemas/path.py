"""Practice path schemas."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.problem import ProblemResponse


class PathCreateRequest(BaseModel):
    """Request to generate a new practice path."""

    name: str = Field(..., min_length=1, max_length=255)
    topics: list[str] = Field(..., min_length=1)
    min_rating: int = Field(800, ge=800, le=3500)
    max_rating: int = Field(1600, ge=800, le=3500)
    mode: str = Field("learning", pattern="^(learning|revision|challenge)$")
    forced_mode: bool = False
    problem_count: int = Field(30, ge=5, le=100)


class PathProblemResponse(BaseModel):
    id: int
    position: int
    status: str
    problem: ProblemResponse
    unlocked_at: Optional[datetime] = None
    solved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PathResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    topics: list[str]
    min_rating: int
    max_rating: int
    mode: str
    forced_mode: bool
    current_position: int
    total_problems: int
    status: str
    progress_pct: float = 0.0
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PathDetailResponse(PathResponse):
    """Path response with all problems included."""

    problems: list[PathProblemResponse] = []


class PathListResponse(BaseModel):
    paths: list[PathResponse]
    total: int


class PathUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = Field(None, pattern="^(active|paused|abandoned)$")


class MarkSolvedRequest(BaseModel):
    """Mark a problem in a path as solved."""

    path_id: uuid.UUID
    problem_id: int
    time_spent_seconds: int = 0
    hints_used: int = 0
