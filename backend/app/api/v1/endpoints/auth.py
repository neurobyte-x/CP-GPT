"""
Authentication endpoints — powered by FastAPI-Users.

FastAPI-Users provides register/login/logout routers out of the box.
This module just re-exports them under our /auth prefix.
We also add a custom /auth/me endpoint for convenience.
"""

from fastapi import APIRouter


router = APIRouter(prefix="/auth", tags=["Authentication"])
