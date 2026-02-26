"""
Background task scheduler.
Uses asyncio-based scheduling for periodic jobs.
In production, consider replacing with APScheduler, Celery, or ARQ.
"""

import asyncio
import logging
from datetime import timedelta

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class BackgroundScheduler:
    """
    Simple asyncio-based background task scheduler.
    For production, migrate to a proper task queue (Celery/ARQ).
    """

    def __init__(self):
        self._tasks: list[asyncio.Task] = []
        self._running = False

    async def start(self) -> None:
        """Start all scheduled background tasks."""
        if self._running:
            return

        self._running = True
        logger.info("Background scheduler starting...")

        # Schedule periodic CF sync
        self._tasks.append(
            asyncio.create_task(
                self._periodic_task(
                    name="cf_problem_sync",
                    interval=timedelta(hours=settings.CF_SYNC_INTERVAL_HOURS),
                    func=self._sync_problems,
                    run_on_start=settings.SYNC_ON_STARTUP,
                )
            )
        )

        logger.info(f"Scheduled {len(self._tasks)} background tasks")

    async def stop(self) -> None:
        """Cancel all background tasks."""
        self._running = False
        for task in self._tasks:
            task.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info("Background scheduler stopped")

    async def _periodic_task(
        self,
        name: str,
        interval: timedelta,
        func,
        run_on_start: bool = False,
    ) -> None:
        """Run a function periodically."""
        if run_on_start:
            try:
                logger.info(f"Running {name} on startup...")
                await func()
            except Exception as e:
                logger.error(f"Startup run of {name} failed: {e}")

        while self._running:
            try:
                await asyncio.sleep(interval.total_seconds())
                if not self._running:
                    break
                logger.info(f"Running scheduled task: {name}")
                await func()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduled task {name} failed: {e}")
                # Wait a bit before retrying on failure
                await asyncio.sleep(60)

    @staticmethod
    async def _sync_problems() -> None:
        from app.tasks.cf_sync import sync_codeforces_problems

        await sync_codeforces_problems()


# Singleton
scheduler = BackgroundScheduler()
