"""nb_pas, cheat_meal rename, scales 1-3

Revision ID: 20260602_0003
Revises: 20260602_0002
Create Date: 2026-06-02

"""

from alembic import op
import sqlalchemy as sa


revision = "20260602_0003"
down_revision = "20260602_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("daily_measurements", sa.Column("nb_pas", sa.Integer(), nullable=True))

    for col in ("sommeil", "stress", "energie", "faim"):
        op.execute(
            f"UPDATE daily_measurements SET {col} = LEAST({col}, 3) "
            f"WHERE {col} IS NOT NULL AND {col} > 3"
        )

    for old_name in ("ck_sommeil_1_5", "ck_stress_1_5", "ck_energie_1_5", "ck_faim_1_5"):
        op.drop_constraint(old_name, "daily_measurements", type_="check")

    op.create_check_constraint("ck_sommeil_1_3", "daily_measurements", "sommeil IS NULL OR (sommeil BETWEEN 1 AND 3)")
    op.create_check_constraint("ck_stress_1_3", "daily_measurements", "stress IS NULL OR (stress BETWEEN 1 AND 3)")
    op.create_check_constraint("ck_energie_1_3", "daily_measurements", "energie IS NULL OR (energie BETWEEN 1 AND 3)")
    op.create_check_constraint("ck_faim_1_3", "daily_measurements", "faim IS NULL OR (faim BETWEEN 1 AND 3)")
    op.create_check_constraint(
        "ck_nb_pas_range",
        "daily_measurements",
        "nb_pas IS NULL OR (nb_pas BETWEEN 0 AND 100000)",
    )

    op.alter_column("daily_measurements", "sel_eleve", new_column_name="cheat_meal")


def downgrade() -> None:
    op.alter_column("daily_measurements", "cheat_meal", new_column_name="sel_eleve")
    op.drop_constraint("ck_nb_pas_range", "daily_measurements", type_="check")
    for name in ("ck_sommeil_1_3", "ck_stress_1_3", "ck_energie_1_3", "ck_faim_1_3"):
        op.drop_constraint(name, "daily_measurements", type_="check")
    op.create_check_constraint("ck_sommeil_1_5", "daily_measurements", "sommeil IS NULL OR (sommeil BETWEEN 1 AND 5)")
    op.create_check_constraint("ck_stress_1_5", "daily_measurements", "stress IS NULL OR (stress BETWEEN 1 AND 5)")
    op.create_check_constraint("ck_energie_1_5", "daily_measurements", "energie IS NULL OR (energie BETWEEN 1 AND 5)")
    op.create_check_constraint("ck_faim_1_5", "daily_measurements", "faim IS NULL OR (faim BETWEEN 1 AND 5)")
    op.drop_column("daily_measurements", "nb_pas")
