"""Problem and Tag models with many-to-many relationship."""

from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# ── Association table for Problem <-> Tag many-to-many ───────────
problem_tags = Table(
    "problem_tags",
    Base.metadata,
    Column(
        "problem_id",
        Integer,
        ForeignKey("problems.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    ),
)


class Tag(Base):
    """Codeforces problem tag / topic."""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    category: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # e.g., "data_structures", "algorithms", "math"

    # Relationships
    problems = relationship(
        "Problem", secondary=problem_tags, back_populates="tags", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Tag {self.name}>"


class Problem(Base):
    """Codeforces problem cached locally."""

    __tablename__ = "problems"
    __table_args__ = (
        UniqueConstraint(
            "contest_id", "problem_index", name="uq_problem_contest_index"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contest_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    problem_index: Mapped[str] = mapped_column(String(5), nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    solved_count: Mapped[int] = mapped_column(Integer, default=0, index=True)
    contest_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    contest_type: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # CF, ICPC, IOI
    url: Mapped[str] = mapped_column(Text, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    tags = relationship(
        "Tag", secondary=problem_tags, back_populates="problems", lazy="selectin"
    )
    path_entries = relationship("PathProblem", back_populates="problem", lazy="noload")

    @property
    def problem_id_str(self) -> str:
        """e.g., '1920A'"""
        return f"{self.contest_id}{self.problem_index}"

    def __repr__(self) -> str:
        return f"<Problem {self.contest_id}{self.problem_index}: {self.name} (r={self.rating})>"
