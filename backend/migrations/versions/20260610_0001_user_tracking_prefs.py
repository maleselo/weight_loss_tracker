"""user tracking preferences

Revision ID: 20260610_0001
Revises: 20260606_0001
"""

import sqlalchemy as sa
from alembic import op

revision = "20260610_0001"
down_revision = "20260606_0001"
branch_labels = None
depends_on = None

ALL_FIELDS = sorted(
    [
        "poids_kg",
        "masse_grasse_pct",
        "tour_taille_cm",
        "tension_sys_mmhg",
        "tension_dia_mmhg",
        "fc_repos_bpm",
        "nb_pas",
        "sommeil",
        "stress",
        "energie",
        "faim",
        "entrainement",
        "alcool",
        "cheat_meal",
        "notes",
    ]
)


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "tracked_fields",
            sa.JSON(),
            nullable=False,
            server_default="[]",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "catalog_version_seen",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    # bindparam sans type JSON est casté en VARCHAR par psycopg → erreur sur colonne JSON
    op.execute(
        sa.text("UPDATE users SET tracked_fields = :fields, catalog_version_seen = 1").bindparams(
            sa.bindparam("fields", ALL_FIELDS, type_=sa.JSON()),
        )
    )


def downgrade() -> None:
    op.drop_column("users", "catalog_version_seen")
    op.drop_column("users", "tracked_fields")
