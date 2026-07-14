"""club approval workflow

Revision ID: 004_club_approval
Revises: 003_notification_replies
Create Date: 2026-07-14
"""
from alembic import op
import sqlalchemy as sa

revision = '004_club_approval'
down_revision = '003_notification_replies'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('clubs', sa.Column(
        'approval_status', sa.Enum('pending', 'approved', 'rejected', name='clubapprovalstatus'),
        nullable=False, server_default='pending',
    ))
    op.add_column('clubs', sa.Column('rejection_reason', sa.String(500), nullable=True))
    op.add_column('clubs', sa.Column('reviewed_by', sa.Integer, sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    op.add_column('clubs', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('clubs', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))

    # Existing clubs were live before the approval workflow existed — grandfather them in as approved.
    op.execute("UPDATE clubs SET approval_status = 'approved'")


def downgrade():
    op.drop_column('clubs', 'updated_at')
    op.drop_column('clubs', 'reviewed_at')
    op.drop_column('clubs', 'reviewed_by')
    op.drop_column('clubs', 'rejection_reason')
    op.drop_column('clubs', 'approval_status')
