"""initial schema — all tables

Revision ID: 001_initial
Revises:
Create Date: 2026-02-27 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("username", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("is_admin", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("cf_handle", sa.String(100), unique=True, nullable=True, index=True),
        sa.Column("estimated_rating", sa.Integer(), nullable=True),
        sa.Column("cf_max_rating", sa.Integer(), nullable=True),
        sa.Column("cf_last_synced", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── tags ─────────────────────────────────────────────────────
    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("category", sa.String(50), nullable=True),
    )

    # ── problems ─────────────────────────────────────────────────
    op.create_table(
        "problems",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("contest_id", sa.Integer(), nullable=False, index=True),
        sa.Column("problem_index", sa.String(5), nullable=False),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True, index=True),
        sa.Column(
            "solved_count", sa.Integer(), server_default=sa.text("0"), index=True
        ),
        sa.Column("contest_name", sa.String(500), nullable=True),
        sa.Column("contest_type", sa.String(20), nullable=True),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "contest_id", "problem_index", name="uq_problem_contest_index"
        ),
    )

    # ── problem_tags (many-to-many) ──────────────────────────────
    op.create_table(
        "problem_tags",
        sa.Column(
            "problem_id",
            sa.Integer(),
            sa.ForeignKey("problems.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tag_id",
            sa.Integer(),
            sa.ForeignKey("tags.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    # ── practice_paths ───────────────────────────────────────────
    pathmode_enum = postgresql.ENUM(
        "learning", "revision", "challenge", name="pathmode", create_type=True
    )
    pathstatus_enum = postgresql.ENUM(
        "active",
        "paused",
        "completed",
        "abandoned",
        name="pathstatus",
        create_type=True,
    )

    op.create_table(
        "practice_paths",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("topics", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("min_rating", sa.Integer(), nullable=False),
        sa.Column("max_rating", sa.Integer(), nullable=False),
        sa.Column("mode", pathmode_enum, nullable=False, server_default="learning"),
        sa.Column("forced_mode", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("current_position", sa.Integer(), server_default=sa.text("0")),
        sa.Column("total_problems", sa.Integer(), server_default=sa.text("0")),
        sa.Column("status", pathstatus_enum, nullable=False, server_default="active"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── path_problems ────────────────────────────────────────────
    problemstatus_enum = postgresql.ENUM(
        "locked",
        "unlocked",
        "attempted",
        "solved",
        "skipped",
        name="problemstatus",
        create_type=True,
    )

    op.create_table(
        "path_problems",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "path_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("practice_paths.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "problem_id",
            sa.Integer(),
            sa.ForeignKey("problems.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column(
            "status", problemstatus_enum, nullable=False, server_default="locked"
        ),
        sa.Column("unlocked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("solved_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── user_progress ────────────────────────────────────────────
    attemptstatus_enum = postgresql.ENUM(
        "attempted", "solved", "gave_up", name="attemptstatus", create_type=True
    )

    op.create_table(
        "user_progress",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "problem_id",
            sa.Integer(),
            sa.ForeignKey("problems.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "status", attemptstatus_enum, nullable=False, server_default="attempted"
        ),
        sa.Column("attempts", sa.Integer(), server_default=sa.text("1")),
        sa.Column("time_spent_seconds", sa.Integer(), server_default=sa.text("0")),
        sa.Column("hints_used", sa.Integer(), server_default=sa.text("0")),
        sa.Column("cf_verdict", sa.String(50), nullable=True),
        sa.Column(
            "first_attempted_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("solved_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── user_topic_stats ─────────────────────────────────────────
    op.create_table(
        "user_topic_stats",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "tag_id",
            sa.Integer(),
            sa.ForeignKey("tags.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("problems_solved", sa.Integer(), server_default=sa.text("0")),
        sa.Column("problems_attempted", sa.Integer(), server_default=sa.text("0")),
        sa.Column("avg_rating_solved", sa.Float(), server_default=sa.text("0.0")),
        sa.Column("max_rating_solved", sa.Integer(), server_default=sa.text("0")),
        sa.Column("estimated_skill", sa.Integer(), server_default=sa.text("800")),
        sa.Column(
            "last_updated",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── cf_sync_logs ─────────────────────────────────────────────
    syncstatus_enum = postgresql.ENUM(
        "running", "success", "failed", name="syncstatus", create_type=True
    )

    op.create_table(
        "cf_sync_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("sync_type", sa.String(50), nullable=False),
        sa.Column("status", syncstatus_enum, nullable=False, server_default="running"),
        sa.Column("problems_synced", sa.Integer(), server_default=sa.text("0")),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("cf_sync_logs")
    op.drop_table("user_topic_stats")
    op.drop_table("user_progress")
    op.drop_table("path_problems")
    op.drop_table("practice_paths")
    op.drop_table("problem_tags")
    op.drop_table("problems")
    op.drop_table("tags")
    op.drop_table("users")

    # Drop custom enum types
    sa.Enum(name="syncstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="attemptstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="problemstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="pathstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="pathmode").drop(op.get_bind(), checkfirst=True)
