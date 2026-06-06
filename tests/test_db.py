"""Unit tests — database layer."""

from db.repository import EnatRepository


def test_seed_creates_entities(test_db):
    with test_db.session() as session:
        repo = EnatRepository(session)
        events = repo.list_dirt_events()
        assert len(events) >= 1


def test_latest_metric_google(test_db):
    with test_db.session() as session:
        repo = EnatRepository(session)
        snap = repo.latest_metric("google_cloud")
        assert snap is not None
        assert snap.accumulated_cost == 3.77


def test_add_entity_cumulative(test_db):
    with test_db.session() as session:
        repo = EnatRepository(session)
        repo.add_entity("google_cloud", "project", "Test-Proj", "google/test/proj", None)
        session.commit()
        entities = repo.list_providers_entities("google_cloud")
        names = [e.name for e in entities]
        assert "Test-Proj" in names
