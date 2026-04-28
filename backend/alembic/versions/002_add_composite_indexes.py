"""add_composite_indexes_for_performance

Revision ID: 002
Revises: 001
Create Date: 2025-01-01 00:00:00.000000

Add composite database indexes to optimize recommender queries,
user progress lookups, and conversation history retrieval.
"""

from alembic import op

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        'ix_problems_rating_solved',
        'problems',
        ['rating', 'solved_count'],
        if_not_exists=True,
    )

    op.create_index(
        'ix_user_progress_user_status',
        'user_progress',
        ['user_id', 'status'],
        if_not_exists=True,
    )

    op.create_index(
        'ix_user_progress_user_solved_at',
        'user_progress',
        ['user_id', 'solved_at'],
        if_not_exists=True,
    )

    op.create_index(
        'ix_messages_conversation_created',
        'messages',
        ['conversation_id', 'created_at'],
        if_not_exists=True,
    )

    op.create_index(
        'ix_problem_tags_tag_problem',
        'problem_tags',
        ['tag_id', 'problem_id'],
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index('ix_problem_tags_tag_problem', table_name='problem_tags')
    op.drop_index('ix_messages_conversation_created', table_name='messages')
    op.drop_index('ix_user_progress_user_solved_at', table_name='user_progress')
    op.drop_index('ix_user_progress_user_status', table_name='user_progress')
    op.drop_index('ix_problems_rating_solved', table_name='problems')
