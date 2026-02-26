"""
API dependency injection — auth, DB session, current user.

With FastAPI-Users, most auth dependencies come from core.users.
This file re-exports them for backward compatibility and adds extras.
"""

from fastapi import Depends

from app.core.users import (
    current_active_user,
    current_superuser,
    optional_current_user,
)
from app.database import get_db  # noqa: F401
from app.models.user import User

# Re-export FastAPI-Users dependencies under the names other endpoints expect.
get_current_user = current_active_user
get_optional_user = optional_current_user
require_admin = current_superuser
