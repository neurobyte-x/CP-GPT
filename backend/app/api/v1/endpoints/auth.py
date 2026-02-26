"""
Authentication endpoints — powered by FastAPI-Users.

FastAPI-Users provides register/login/logout routers out of the box.
This module just re-exports them under our /auth prefix.
We also add a custom /auth/me endpoint for convenience.
"""

from fastapi import APIRouter

# This file is intentionally minimal.
# The actual auth routers are included in router.py from core.users.
# Keeping this file so imports don't break, but it has no routes of its own.

router = APIRouter(prefix="/auth", tags=["Authentication"])
