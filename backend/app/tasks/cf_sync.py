"""
Background task for Codeforces data synchronization.
Runs periodically to keep the local problem cache fresh.
Includes retry logic with exponential backoff.
"""

import asyncio
import logging
from datetime import datetime, timezone

from app.config import get_settings
from app.database import async_session_factory
from app.services.codeforces import cf_service

logger = logging.getLogger(__name__)
settings = get_settings()

MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 5


async def sync_codeforces_problems() -> None:
    """
    Full sync of the Codeforces problem database.
    Retries with exponential backoff on failure.
    """
    for attempt in range(1, MAX_RETRIES + 1):
        logger.info(
            f"Starting Codeforces problem sync (attempt {attempt}/{MAX_RETRIES})..."
        )
        async with async_session_factory() as db:
            try:
                count = await cf_service.sync_problems(db)
                await db.commit()
                logger.info(f"Codeforces sync completed: {count} problems synced")
                return
            except Exception as e:
                await db.rollback()
                logger.error(
                    f"Codeforces sync failed (attempt {attempt}/{MAX_RETRIES}): {e}"
                )
                if attempt < MAX_RETRIES:
                    backoff = BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
                    logger.info(f"Retrying in {backoff}s...")
                    await asyncio.sleep(backoff)
                else:
                    logger.error(
                        "Codeforces sync failed after all retries. Giving up."
                    )


async def sync_user_data(user_id: str, cf_handle: str) -> None:
    """
    Sync a specific user's Codeforces data in the background.
    Called after user links their CF handle.
    Includes retry logic.
    """
    from app.models.user import User
    from app.services.user_analyzer import user_analyzer
    from sqlalchemy import select

    for attempt in range(1, MAX_RETRIES + 1):
        logger.info(
            f"Syncing CF data for user {cf_handle} (attempt {attempt}/{MAX_RETRIES})..."
        )
        async with async_session_factory() as db:
            try:
                result = await db.execute(
                    select(User).where(User.cf_handle == cf_handle)
                )
                user = result.scalar_one_or_none()
                if user:
                    await user_analyzer.sync_user_cf_data(db, user)
                    await db.commit()
                    logger.info(f"User sync completed for {cf_handle}")
                else:
                    logger.warning(f"User with handle {cf_handle} not found")
                return
            except Exception as e:
                await db.rollback()
                logger.error(
                    f"User sync failed for {cf_handle} (attempt {attempt}/{MAX_RETRIES}): {e}"
                )
                if attempt < MAX_RETRIES:
                    backoff = BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
                    await asyncio.sleep(backoff)
