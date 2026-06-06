"""SQLAlchemy ORM models — cumulative eNAT schema (no deletes)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def utcnow() -> datetime:
    return datetime.now(UTC)


class ProviderEntity(Base):
    """Hierarchy node: billing_account → project → byok (or provider-specific tiers)."""

    __tablename__ = "provider_entities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[str] = mapped_column(String(64), index=True)
    tier: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(256))
    hierarchy_path: Mapped[str] = mapped_column(String(512), unique=True, index=True)
    parent_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MetricSnapshot(Base):
    """Live metrics — append-only history (cumulative)."""

    __tablename__ = "metric_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[str] = mapped_column(String(64), index=True)
    hierarchy_path: Mapped[str] = mapped_column(String(512), index=True)
    metrics_profile: Mapped[str] = mapped_column(String(64))
    tpm_usage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tpm_ceiling: Mapped[int | None] = mapped_column(Integer, nullable=True)
    accumulated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    spend_cap: Mapped[float | None] = mapped_column(Float, nullable=True)
    promo_balance: Mapped[float | None] = mapped_column(Float, nullable=True)
    promo_expires: Mapped[str | None] = mapped_column(String(32), nullable=True)
    allowance_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    cpu_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    memory_gb_free: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class DirtEvent(Base):
    """DIRT entity registry pipeline log."""

    __tablename__ = "dirt_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    level: Mapped[str] = mapped_column(String(16), default="INFO")
    message: Mapped[str] = mapped_column(Text)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
