"""health_connections table

Revision ID: 20260605_0001
Revises: 20260602_0004
Create Date: 2026-06-05

"""

from alembic import op
import sqlalchemy as sa


revision = "20260605_0001"
down_revision = "20260602_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "health_connections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column(
            "connected_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_sync_status", sa.String(length=16), nullable=True),
        sa.Column("last_sync_message", sa.Text(), nullable=True),
        sa.Column("auto_sync", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "provider", name="uq_health_connections_user_provider"),
    )
    op.create_index("ix_health_connections_user_id", "health_connections", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_health_connections_user_id", table_name="health_connections")
    op.drop_table("health_connections")
