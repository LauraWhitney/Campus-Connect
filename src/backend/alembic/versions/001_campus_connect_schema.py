"""campus_connect full schema

Revision ID: 001_campus_connect
Revises:
Create Date: 2026-06-01
"""
from alembic import op
import sqlalchemy as sa

revision = '001_campus_connect'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ── event_rsvps: replace simple join table with status model ──
    # The old table (if it exists) was a bare 2-column join table.
    # We recreate it as a proper model with id + status.
    op.execute("DROP TABLE IF EXISTS event_rsvps")
    op.create_table(
        'event_rsvps',
        sa.Column('id',         sa.Integer,    primary_key=True, index=True),
        sa.Column('event_id',   sa.Integer,    sa.ForeignKey('events.id',  ondelete='CASCADE'), nullable=False),
        sa.Column('user_id',    sa.Integer,    sa.ForeignKey('users.id',   ondelete='CASCADE'), nullable=False),
        sa.Column('status',     sa.Enum('pending', 'approved', 'rejected', name='rsvpstatus'), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── clubs: add meeting_location and registration_number ──
    op.add_column('clubs', sa.Column('meeting_location',   sa.String(200), nullable=True))
    op.add_column('clubs', sa.Column('registration_number', sa.String(100), nullable=True))
    try:
        op.create_unique_constraint('uq_clubs_registration_number', 'clubs', ['registration_number'])
    except Exception:
        pass

    # ── club_join_requests ──
    op.create_table(
        'club_membership_requests',
        sa.Column('id',               sa.Integer,    primary_key=True, index=True),
        sa.Column('club_id',          sa.Integer,    sa.ForeignKey('clubs.id',  ondelete='CASCADE'), nullable=False),
        sa.Column('user_id',          sa.Integer,    sa.ForeignKey('users.id',  ondelete='CASCADE'), nullable=False),
        sa.Column('course',           sa.String(150), nullable=False),
        sa.Column('year',             sa.Integer,    nullable=False),
        sa.Column('name',             sa.String(150), nullable=False),
        sa.Column('phone',            sa.String(30),  nullable=False),
        sa.Column('admission_number', sa.String(50),  nullable=False),
        sa.Column('status',           sa.String(20),  nullable=False, server_default='pending'),
        sa.Column('created_at',       sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── marketplace_items: add contact_info ──
    op.add_column('marketplace_items', sa.Column('contact', sa.String(200), nullable=True))


def downgrade():
    op.drop_column('marketplace_items', 'contact')
    op.drop_table('club_membership_requests')
    op.drop_column('clubs', 'registration_number')
    op.drop_column('clubs', 'meeting_location')
    op.drop_table('event_rsvps')
