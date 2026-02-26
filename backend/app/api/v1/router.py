"""
V1 API router — aggregates all endpoint modules + FastAPI-Users auth routers.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import coaching, paths, problems, progress, users
from app.core.users import auth_backend, fastapi_users
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/api/v1")

# ── FastAPI-Users auth routers ───────────────────────────────────
# POST /api/v1/auth/login  (form data: username=email, password)
# POST /api/v1/auth/logout
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth",
    tags=["Authentication"],
)

# POST /api/v1/auth/register (JSON body: email, password, username, cf_handle?)
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["Authentication"],
)

# ── Domain routers ───────────────────────────────────────────────
router.include_router(users.router)
router.include_router(problems.router)
router.include_router(paths.router)
router.include_router(progress.router)
router.include_router(coaching.router)
