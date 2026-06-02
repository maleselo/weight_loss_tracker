"""init daily_measurements

Revision ID: 20260602_0001
Revises: 
Create Date: 2026-06-02

"""

from alembic import op
import sqlalchemy as sa


revision = "20260602_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "daily_measurements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False, unique=True),
        sa.Column("poids_kg", sa.Numeric(5, 1), nullable=True),
        sa.Column("masse_grasse_pct", sa.Numeric(4, 1), nullable=True),
        sa.Column("tour_taille_cm", sa.Numeric(5, 1), nullable=True),
        sa.Column("tension_sys_mmhg", sa.Integer(), nullable=True),
        sa.Column("tension_dia_mmhg", sa.Integer(), nullable=True),
        sa.Column("fc_repos_bpm", sa.Integer(), nullable=True),
        sa.Column("sommeil", sa.Integer(), nullable=True),
        sa.Column("stress", sa.Integer(), nullable=True),
        sa.Column("energie", sa.Integer(), nullable=True),
        sa.Column("faim", sa.Integer(), nullable=True),
        sa.Column("entrainement", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("alcool", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sel_eleve", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=32), nullable=False, server_default="manual"),
        sa.CheckConstraint(
            "(tension_sys_mmhg IS NULL AND tension_dia_mmhg IS NULL) OR (tension_dia_mmhg < tension_sys_mmhg)",
            name="ck_tension_dia_lt_sys",
        ),
        sa.CheckConstraint("sommeil IS NULL OR (sommeil BETWEEN 1 AND 5)", name="ck_sommeil_1_5"),
        sa.CheckConstraint("stress IS NULL OR (stress BETWEEN 1 AND 5)", name="ck_stress_1_5"),
        sa.CheckConstraint("energie IS NULL OR (energie BETWEEN 1 AND 5)", name="ck_energie_1_5"),
        sa.CheckConstraint("faim IS NULL OR (faim BETWEEN 1 AND 5)", name="ck_faim_1_5"),
    )


def downgrade() -> None:
    op.drop_table("daily_measurements")

