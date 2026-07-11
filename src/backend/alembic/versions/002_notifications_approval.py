"""notifications, contact messages, event approval workflow

Revision ID: 002_notifications_approval
Revises: 001_campus_connect
Create Date: 2026-07-10
"""
from alembic import op
import sqlalchemy as sa

revision = '002_notifications_approval'
down_revision = '001_campus_connect'
branch_labels = None
depends_on = None


def upgrade():
    # ── notifications ──────────────────────────────────
    op.create_table(
        'notifications',
        sa.Column('id',         sa.Integer, primary_key=True, index=True),
        sa.Column('audience',   sa.Enum('user', 'admin', name='notificationaudience'), nullable=False, server_default='user'),
        sa.Column('user_id',    sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('type',       sa.Enum('feedback', 'event', 'club', 'lostfound', 'contact', 'system', name='notificationtype'),
                   nullable=False, server_default='system'),
        sa.Column('title',      sa.String(200), nullable=False),
        sa.Column('message',    sa.String(500), nullable=False),
        sa.Column('link',       sa.String(300), nullable=True),
        sa.Column('is_read',    sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── contact_messages ───────────────────────────────
    op.create_table(
        'contact_messages',
        sa.Column('id',             sa.Integer, primary_key=True, index=True),
        sa.Column('name',           sa.String(150), nullable=False),
        sa.Column('email',          sa.String(255), nullable=False),
        sa.Column('message',        sa.Text, nullable=False),
        sa.Column('email_sent',     sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column('admin_notified', sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column('created_at',     sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── events: approval workflow ──────────────────────
    op.add_column('events', sa.Column(
        'approval_status', sa.Enum('pending', 'approved', 'rejected', name='eventapprovalstatus'),
        nullable=False, server_default='pending',
    ))
    op.add_column('events', sa.Column('rejection_reason', sa.String(500), nullable=True))
    op.add_column('events', sa.Column('reviewed_by', sa.Integer, sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    op.add_column('events', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('events', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))

    # Existing events were live before the approval workflow existed — grandfather them in as approved.
    op.execute("UPDATE events SET approval_status = 'approved'")

    # ── club_membership_requests: admission_number no longer required ──
    op.alter_column('club_membership_requests', 'admission_number', existing_type=sa.String(50), nullable=True)


def downgrade():
    op.alter_column('club_membership_requests', 'admission_number', existing_type=sa.String(50), nullable=False)
    op.drop_column('events', 'updated_at')
    op.drop_column('events', 'reviewed_at')
    op.drop_column('events', 'reviewed_by')
    op.drop_column('events', 'rejection_reason')
    op.drop_column('events', 'approval_status')
    op.drop_table('contact_messages')
    op.drop_table('notifications')
