"""Repository layer — isolates SQL from services."""

from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from db.models import DirtEvent, MetricSnapshot, ProviderEntity


class EnatRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_providers_entities(self, provider_id: str) -> list[ProviderEntity]:
        stmt = select(ProviderEntity).where(
            ProviderEntity.provider_id == provider_id,
            ProviderEntity.active.is_(True),
        )
        return list(self._session.scalars(stmt))

    def latest_metric(self, provider_id: str, hierarchy_path: str | None = None) -> MetricSnapshot | None:
        stmt = select(MetricSnapshot).where(MetricSnapshot.provider_id == provider_id)
        if hierarchy_path:
            stmt = stmt.where(MetricSnapshot.hierarchy_path == hierarchy_path)
        stmt = stmt.order_by(desc(MetricSnapshot.recorded_at)).limit(1)
        return self._session.scalar(stmt)

    def list_latest_metrics_by_provider(self) -> dict[str, MetricSnapshot]:
        result: dict[str, MetricSnapshot] = {}
        stmt = select(MetricSnapshot).order_by(desc(MetricSnapshot.recorded_at))
        for snap in self._session.scalars(stmt):
            if snap.provider_id not in result:
                result[snap.provider_id] = snap
        return result

    def list_dirt_events(self, limit: int = 20) -> list[DirtEvent]:
        stmt = select(DirtEvent).order_by(desc(DirtEvent.recorded_at)).limit(limit)
        return list(self._session.scalars(stmt))

    def add_dirt_event(self, message: str, level: str = "INFO") -> DirtEvent:
        event = DirtEvent(message=message, level=level)
        self._session.add(event)
        return event

    def add_entity(
        self,
        provider_id: str,
        tier: str,
        name: str,
        hierarchy_path: str,
        parent_path: str | None = None,
    ) -> ProviderEntity:
        entity = ProviderEntity(
            provider_id=provider_id,
            tier=tier,
            name=name,
            hierarchy_path=hierarchy_path,
            parent_path=parent_path,
            active=True,
        )
        self._session.add(entity)
        return entity
