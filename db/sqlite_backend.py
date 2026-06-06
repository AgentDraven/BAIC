"""SQLite backend — default for local dev and WebHostingPad-compatible deploys."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from core.config_loader import AppConfig, resolve_db_file
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from db.models import Base, ProviderEntity
from db.ports import DatabasePort
from db.seed import seed_demo_data


class SQLiteBackend(DatabasePort):
    def __init__(self, config: AppConfig, stub_mode: bool = False) -> None:
        self._config = config
        self._stub_mode = stub_mode
        self._db_file = resolve_db_file(config)
        self._db_file.parent.mkdir(parents=True, exist_ok=True)
        url = f"sqlite:///{self._db_file.as_posix()}"
        self._engine = create_engine(
            url,
            echo=config.database.echo,
            connect_args={"check_same_thread": False},
        )
        self._session_factory = sessionmaker(bind=self._engine, autoflush=False, autocommit=False)

    def initialize(self) -> None:
        Base.metadata.create_all(self._engine)
        if not self._stub_mode:
            return
        with self.session() as session:
            has_data = session.scalar(select(ProviderEntity.id).limit(1)) is not None
            if not has_data:
                seed_demo_data(session)
                session.commit()

    @contextmanager
    def session(self) -> Iterator[Session]:
        session = self._session_factory()
        try:
            yield session
        finally:
            session.close()

    def dispose(self) -> None:
        self._engine.dispose()

    def health(self) -> dict[str, Any]:
        return {
            "engine": "sqlite",
            "path": str(self._db_file),
            "connected": True,
            "stub_mode": self._stub_mode,
        }


def create_database(config: AppConfig, stub_mode: bool = False) -> DatabasePort:
    engine = config.database.engine.lower()
    if engine == "sqlite":
        return SQLiteBackend(config, stub_mode=stub_mode)
    raise NotImplementedError(f"Database engine '{engine}' not yet implemented. Use sqlite.")
