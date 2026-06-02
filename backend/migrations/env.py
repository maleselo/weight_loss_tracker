import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import normalize_postgres_url, settings
from app.db.base import Base
from app.models.daily_measurement import DailyMeasurement  # noqa: F401
from app.models.user import User  # noqa: F401

config = context.config
fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    # Alembic lit sqlalchemy.url depuis la config; on le surcharge avec DATABASE_URL.
    raw = os.getenv("DATABASE_URL", settings.database_url)
    return normalize_postgres_url(raw)


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

