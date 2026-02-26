"""User model — compatible with FastAPI-Users."""

import uuid
from datetime import datetime

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    """
    User model extending FastAPI-Users base.

    Inherited from SQLAlchemyBaseUserTableUUID:
      - id (UUID, primary key)
      - email (String 320, unique, indexed)
      - hashed_password (String 1024)
      - is_active (Boolean, default True)
      - is_superuser (Boolean, default False)
      - is_verified (Boolean, default False)
    """

    __tablename__ = "users"

    # ── Custom fields ────────────────────────────────────────────
    username: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )

    # Codeforces integration
    cf_handle: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True, index=True
    )
    estimated_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cf_max_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cf_last_synced: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    practice_paths = relationship(
        "PracticePath", back_populates="user", lazy="selectin"
    )
    progress_records = relationship(
        "UserProgress", back_populates="user", lazy="selectin"
    )
    topic_stats = relationship("UserTopicStats", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.username} (cf={self.cf_handle})>"
