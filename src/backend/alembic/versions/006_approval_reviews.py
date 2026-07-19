"""structured approval review history for clubs and events

Revision ID: 006_approval_reviews
Revises: 005_password_reset_tokens
Create Date: 2026-07-19
"""
from alembic import op
import sqlalchemy as sa

revision = '006_approval_reviews'
down_revision = '005_password_reset_tokens'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'approval_reviews',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('entity_type', sa.String(10), nullable=False),
        sa.Column('entity_id', sa.Integer, nullable=False),
        sa.Column('action', sa.String(10), nullable=False),
        sa.Column('previous_status', sa.String(20), nullable=False),
        sa.Column('new_status', sa.String(20), nullable=False),
        sa.Column('reason', sa.String(500), nullable=True),
        sa.Column('reviewed_by', sa.Integer, sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('approval_reviews')
