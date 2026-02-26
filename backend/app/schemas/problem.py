"""Problem and Tag schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TagResponse(BaseModel):
    id: int
    name: str
    slug: str
    category: Optional[str] = None
    problem_count: int = 0

    model_config = {"from_attributes": True}


class ProblemBase(BaseModel):
    contest_id: int
    problem_index: str
    name: str
    rating: Optional[int] = None
    solved_count: int = 0
    url: str


class ProblemResponse(ProblemBase):
    id: int
    tags: list[TagResponse] = []
    contest_name: Optional[str] = None
    contest_type: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProblemListResponse(BaseModel):
    problems: list[ProblemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProblemFilters(BaseModel):
    """Query filters for problem browsing."""

    tags: Optional[list[str]] = None
    min_rating: Optional[int] = Field(None, ge=800, le=3500)
    max_rating: Optional[int] = Field(None, ge=800, le=3500)
    min_solved_count: Optional[int] = None
    search: Optional[str] = None
    exclude_solved: bool = False
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    sort_by: str = Field("rating", pattern="^(rating|solved_count|contest_id|name)$")
    sort_order: str = Field("asc", pattern="^(asc|desc)$")
