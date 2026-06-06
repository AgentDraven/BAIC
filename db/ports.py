"""Database port — swap backends without touching core services."""

from __future__ import annotations

from abc import ABC, abstractmethod
from contextlib import AbstractContextManager
from typing import Any

from sqlalchemy.orm import Session


class DatabasePort(ABC):
    """Abstract database backend (SQLite today; PostgreSQL tomorrow)."""

    @abstractmethod
    def initialize(self) -> None:
        """Create schema and seed if empty."""

    @abstractmethod
    def session(self) -> AbstractContextManager[Session]:
        """Yield a SQLAlchemy session."""

    @abstractmethod
    def dispose(self) -> None:
        """Release connections."""

    @abstractmethod
    def health(self) -> dict[str, Any]:
        """Return engine status for admin/ops."""
