"""Progress tracking and sync log models."""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AttemptStatus(str, PyEnum):
    ATTEMPTED = "attempted"
    SOLVED = "solved"
    GAVE_UP = "gave_up"


class UserProgress(Base):
    """Tracks a user's interaction with individual problems."""

    __tablename__ = "user_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    problem_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[AttemptStatus] = mapped_column(
        Enum(AttemptStatus, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=AttemptStatus.ATTEMPTED,
    )
    attempts: Mapped[int] = mapped_column(Integer, default=1)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)

    # Codeforces verdict (if synced)
    cf_verdict: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Timestamps
    first_attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    solved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user = relationship("User", back_populates="progress_records")
    problem = relationship("Problem", lazy="selectin")

    def __repr__(self) -> str:
        return f"<UserProgress user={self.user_id} problem={self.problem_id} status={self.status.value}>"


class UserTopicStats(Base):
    """Aggregated statistics per user per topic."""

    __tablename__ = "user_topic_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tag_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False
    )
    problems_solved: Mapped[int] = mapped_column(Integer, default=0)
    problems_attempted: Mapped[int] = mapped_column(Integer, default=0)
    avg_rating_solved: Mapped[float] = mapped_column(Float, default=0.0)
    max_rating_solved: Mapped[int] = mapped_column(Integer, default=0)
    estimated_skill: Mapped[int] = mapped_column(Integer, default=800)

    # Timestamps
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="topic_stats")
    tag = relationship("Tag", lazy="selectin")

    def __repr__(self) -> str:
        return f"<UserTopicStats user={self.user_id} tag={self.tag_id} skill={self.estimated_skill}>"


class SyncStatus(str, PyEnum):
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class CFSyncLog(Base):
    """Audit log for Codeforces data synchronization runs."""

    __tablename__ = "cf_sync_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sync_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "problems", "user_submissions", "contest_list"
    status: Mapped[SyncStatus] = mapped_column(
        Enum(SyncStatus, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=SyncStatus.RUNNING,
    )
    problems_synced: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<CFSyncLog {self.sync_type} {self.status.value}>"
