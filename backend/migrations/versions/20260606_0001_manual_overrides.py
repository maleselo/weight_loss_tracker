"""manual_overrides on daily_measurements

Revision ID: 20260606_0001
Revises: 20260605_0002
Create Date: 2026-06-06

"""

from alembic import op
import sqlalchemy as sa


revision = "20260606_0001"
down_revision = "20260605_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "daily_measurements",
        sa.Column(
            "manual_overrides",
            sa.JSON(),
            nullable=False,
            server_default="[]",
        ),
    )


def downgrade() -> None:
    op.drop_column("daily_measurements", "manual_overrides")
