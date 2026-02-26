"""
Background task for Codeforces data synchronization.
Runs periodically to keep the local problem cache fresh.
"""

import asyncio
import logging
from datetime import datetime, timezone

from app.config import get_settings
from app.database import async_session_factory
from app.services.codeforces import cf_service

logger = logging.getLogger(__name__)
settings = get_settings()


async def sync_codeforces_problems() -> None:
    """
    Full sync of the Codeforces problem database.
    Should be called on startup and periodically.
    """
    logger.info("Starting Codeforces problem sync...")
    async with async_session_factory() as db:
        try:
            count = await cf_service.sync_problems(db)
            await db.commit()
            logger.info(f"Codeforces sync completed: {count} problems synced")
        except Exception as e:
            await db.rollback()
            logger.error(f"Codeforces sync failed: {e}")
            raise


async def sync_user_data(user_id: str, cf_handle: str) -> None:
    """
    Sync a specific user's Codeforces data in the background.
    Called after user links their CF handle.
    """
    from app.models.user import User
    from app.services.user_analyzer import user_analyzer
    from sqlalchemy import select

    logger.info(f"Syncing CF data for user {cf_handle}...")
    async with async_session_factory() as db:
        try:
            result = await db.execute(select(User).where(User.cf_handle == cf_handle))
            user = result.scalar_one_or_none()
            if user:
                await user_analyzer.sync_user_cf_data(db, user)
                await db.commit()
                logger.info(f"User sync completed for {cf_handle}")
            else:
                logger.warning(f"User with handle {cf_handle} not found")
        except Exception as e:
            await db.rollback()
            logger.error(f"User sync failed for {cf_handle}: {e}")
