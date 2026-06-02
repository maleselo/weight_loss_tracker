"""poids_cible_kg on users

Revision ID: 20260602_0004
Revises: 20260602_0003
Create Date: 2026-06-02

"""

from alembic import op
import sqlalchemy as sa


revision = "20260602_0004"
down_revision = "20260602_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("poids_cible_kg", sa.Numeric(5, 1), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "poids_cible_kg")
