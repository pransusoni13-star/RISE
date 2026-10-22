"""Apply reviewed database migrations before the API starts."""
from pathlib import Path

from alembic import command
from alembic.config import Config


BACKEND_ROOT = Path(__file__).resolve().parent.parent


def upgrade_database(database_url: str | None = None) -> None:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "migrations"))
    if database_url:
        config.attributes["connection_url"] = database_url
    command.upgrade(config, "head")
