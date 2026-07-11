"""admin reply-to-notification support

Revision ID: 003_notification_replies
Revises: 002_notifications_approval
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = '003_notification_replies'
down_revision = '002_notifications_approval'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('notifications', sa.Column('reply_to_email', sa.String(255), nullable=True))
    op.add_column('notifications', sa.Column('admin_reply', sa.Text, nullable=True))
    op.add_column('notifications', sa.Column('replied_by', sa.Integer, sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    op.add_column('notifications', sa.Column('replied_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column('notifications', 'replied_at')
    op.drop_column('notifications', 'replied_by')
    op.drop_column('notifications', 'admin_reply')
    op.drop_column('notifications', 'reply_to_email')
