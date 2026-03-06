"""
CP Path Builder — FastAPI Application Entry Point.

Production-ready application with:
  - CORS middleware
  - Structured logging
  - Lifespan management (startup/shutdown)
  - Health checks
  - Background task scheduling
  - Admin sync endpoint
"""

import logging
from contextlib import asynccontextmanager

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import router as v1_router
from app.config import get_settings
from app.database import close_db, init_db
from app.tasks.scheduler import scheduler

settings = get_settings()

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle management."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")

    if settings.ENVIRONMENT == "development":
        await init_db()
        logger.info("Database tables created/verified")

    await scheduler.start()

    yield

    logger.info("Shutting down...")
    await scheduler.stop()
    await close_db()
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Structured competitive programming practice platform. "
            "Transforms Codeforces problems into guided training paths."
        ),
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(v1_router)

    # Serve frontend static files
    frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
    if frontend_dist.exists():
        app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")
        logger.info(f"Mounted frontend static files from {frontend_dist}")
    else:
        logger.warning(f"Frontend dist directory not found at {frontend_dist}")

    @app.get("/health", tags=["System"])
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    @app.post("/admin/sync-problems", tags=["Admin"])
    async def trigger_sync():
        """Manually trigger a Codeforces problem sync (admin only)."""
        import asyncio
        from app.tasks.cf_sync import sync_codeforces_problems

        asyncio.create_task(sync_codeforces_problems())
        return {"message": "Problem sync started in background"}

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return app


app = create_app()
