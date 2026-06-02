"""users and user_id on daily_measurements

Revision ID: 20260602_0002
Revises: 20260602_0001
Create Date: 2026-06-02

"""

from alembic import op
import sqlalchemy as sa


revision = "20260602_0002"
down_revision = "20260602_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("taille_cm", sa.Numeric(5, 1), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Europe/Paris"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Données de dev sans utilisateur : on repart propre.
    op.execute("DELETE FROM daily_measurements")
    op.drop_constraint("daily_measurements_date_key", "daily_measurements", type_="unique")

    op.add_column("daily_measurements", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_daily_measurements_user_id",
        "daily_measurements",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.alter_column("daily_measurements", "user_id", nullable=False)
    op.create_index("ix_daily_measurements_user_id", "daily_measurements", ["user_id"])
    op.create_unique_constraint(
        "uq_daily_measurements_user_date",
        "daily_measurements",
        ["user_id", "date"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_daily_measurements_user_date", "daily_measurements", type_="unique")
    op.drop_index("ix_daily_measurements_user_id", table_name="daily_measurements")
    op.drop_constraint("fk_daily_measurements_user_id", "daily_measurements", type_="foreignkey")
    op.drop_column("daily_measurements", "user_id")
    op.create_unique_constraint("daily_measurements_date_key", "daily_measurements", ["date"])
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
