"""Practice path models."""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PathMode(str, PyEnum):
    LEARNING = "learning"
    REVISION = "revision"
    CHALLENGE = "challenge"


class PathStatus(str, PyEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class ProblemStatus(str, PyEnum):
    LOCKED = "locked"
    UNLOCKED = "unlocked"
    ATTEMPTED = "attempted"
    SOLVED = "solved"
    SKIPPED = "skipped"


class PracticePath(Base):
    """A generated sequence of problems for structured practice."""

    __tablename__ = "practice_paths"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Configuration
    topics: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    min_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    max_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    mode: Mapped[PathMode] = mapped_column(
        Enum(PathMode, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=PathMode.LEARNING,
    )
    forced_mode: Mapped[bool] = mapped_column(Boolean, default=False)

    # Progress
    current_position: Mapped[int] = mapped_column(Integer, default=0)
    total_problems: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[PathStatus] = mapped_column(
        Enum(PathStatus, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=PathStatus.ACTIVE,
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user = relationship("User", back_populates="practice_paths")
    path_problems = relationship(
        "PathProblem",
        back_populates="path",
        order_by="PathProblem.position",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    @property
    def progress_pct(self) -> float:
        if self.total_problems == 0:
            return 0.0
        return round((self.current_position / self.total_problems) * 100, 1)

    def __repr__(self) -> str:
        return f"<PracticePath '{self.name}' ({self.status.value})>"


class PathProblem(Base):
    """A single problem within a practice path."""

    __tablename__ = "path_problems"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("practice_paths.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    problem_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ProblemStatus] = mapped_column(
        Enum(ProblemStatus, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=ProblemStatus.LOCKED,
    )

    # Timestamps
    unlocked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    solved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    path = relationship("PracticePath", back_populates="path_problems")
    problem = relationship("Problem", back_populates="path_entries", lazy="selectin")

    def __repr__(self) -> str:
        return f"<PathProblem pos={self.position} status={self.status.value}>"
