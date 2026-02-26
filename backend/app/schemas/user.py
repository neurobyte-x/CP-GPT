"""User-related Pydantic schemas — FastAPI-Users compatible."""

import uuid
from datetime import datetime
from typing import Optional

from fastapi_users import schemas as fu_schemas
from pydantic import Field


# ── FastAPI-Users schemas ────────────────────────────────────────
# These extend the base schemas to include our custom fields.


class UserRead(fu_schemas.BaseUser[uuid.UUID]):
    """Schema returned when reading a user."""

    username: str
    cf_handle: Optional[str] = None
    estimated_rating: Optional[int] = None
    cf_max_rating: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserCreate(fu_schemas.BaseUserCreate):
    """Schema for creating a new user (registration)."""

    username: str = Field(..., min_length=3, max_length=100)
    cf_handle: Optional[str] = None


class UserUpdate(fu_schemas.BaseUserUpdate):
    """Schema for updating a user profile."""

    username: Optional[str] = Field(None, min_length=3, max_length=100)
    cf_handle: Optional[str] = None
    estimated_rating: Optional[int] = Field(None, ge=800, le=3500)


# ── Legacy convenience aliases ───────────────────────────────────
# Kept so other modules (dashboard, profile, etc.) don't need big refactors.

UserResponse = UserRead


class UserProfile(UserRead):
    """Extended user profile with stats."""

    total_problems_solved: int = 0
    active_paths: int = 0
    topics_explored: int = 0
    streak_days: int = 0
