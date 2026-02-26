"""Progress tracking schemas."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserProgressResponse(BaseModel):
    id: int
    problem_id: int
    status: str
    attempts: int
    time_spent_seconds: int
    hints_used: int
    cf_verdict: Optional[str] = None
    first_attempted_at: datetime
    solved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TopicStatsResponse(BaseModel):
    tag_name: str
    tag_slug: str
    problems_solved: int
    problems_attempted: int
    avg_rating_solved: float
    max_rating_solved: int
    estimated_skill: int

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    """Aggregated statistics for the user dashboard."""

    total_problems_solved: int = 0
    total_problems_attempted: int = 0
    total_time_spent_hours: float = 0.0
    active_paths: int = 0
    completed_paths: int = 0
    current_streak_days: int = 0
    estimated_rating: Optional[int] = None
    topic_stats: list[TopicStatsResponse] = []
    recent_solves: list[UserProgressResponse] = []
    rating_distribution: dict[str, int] = {}  # rating_bucket -> count


class SyncStatusResponse(BaseModel):
    id: int
    sync_type: str
    status: str
    problems_synced: int
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
