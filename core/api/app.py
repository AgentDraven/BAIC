"""FastAPI application factory."""

from __future__ import annotations

import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Any

from db.ports import DatabasePort
from db.sqlite_backend import create_database
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from core.arbitrage import estimate_tokens, evaluate_route
from core.capability_service import CapabilityService
from core.config_loader import AppConfig, load_merged_provider_secrets, load_provider_registry
from core.config_scaffold import validate_scaffold
from core.error_codes import BaicError
from core.hub_service import HubService
from core.path_resolver import get_repo_root
from core.provider_loader import ProviderRegistry
from core.xray_service import get_xray_buffer


class OperationRequest(BaseModel):
    context: dict[str, Any] = Field(default_factory=dict)


class ProxyRequest(BaseModel):
    prompt: str
    model: str = "gemini-2.5-flash"
    hierarchy_path: str = ""


class XRayEventBody(BaseModel):
    level: str = "DEBUG"
    message: str
    source: str = "ui"
    context: dict[str, Any] = Field(default_factory=dict)


class ActionEventBody(BaseModel):
    schema_name: str = Field(default="merit.telemetry.action.v1", alias="schema")
    event_type: str = Field(min_length=2, max_length=128)
    event_id: str = Field(min_length=2, max_length=180)
    utility_id: str = Field(min_length=2, max_length=64)
    quantity: float = Field(default=1.0, ge=0)
    transport: str = Field(pattern="^(api|local|none)$")
    api_call_made: bool = False
    outcome: str = Field(default="committed", pattern="^(committed|failed|rejected)$")
    cost_usd: float | None = Field(default=None, ge=0)
    cost_source: str | None = Field(default=None, pattern="^(provider|estimated|local|none)$")
    occurred_at: datetime | None = None


class MatrixPatchBody(BaseModel):
    available: bool | None = None
    endpoint_key: str | None = None
    notes: str | None = None


class AppState:
    config: AppConfig
    db: DatabasePort
    registry: ProviderRegistry
    hub: HubService
    capability: CapabilityService
    stub_mode: bool


def create_app(
    config: AppConfig | None = None,
    db: DatabasePort | None = None,
    stub_mode: bool = False,
) -> FastAPI:
    app_config = config or AppConfig.load()
    database = db or create_database(app_config, stub_mode=stub_mode)
    database.initialize()
    secrets_doc = load_merged_provider_secrets()
    registry = ProviderRegistry(
        load_provider_registry(),
        secrets=secrets_doc.get("providers", {}),
        stub_mode=stub_mode,
    )
    hub = HubService(database, registry, app_config)
    capability = CapabilityService(stub_mode=stub_mode)
    xray = get_xray_buffer()
    xray.append("INFO", f"BAIC starting stub_mode={stub_mode}", source="backend")

    state = AppState()
    state.config = app_config
    state.db = database
    state.registry = registry
    state.hub = hub
    state.capability = capability
    state.stub_mode = stub_mode

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        yield
        database.dispose()

    app = FastAPI(title=app_config.app_name, lifespan=lifespan)
    app.state.baic = state

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def xray_http_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        start = time.perf_counter()
        response = await call_next(request)
        if request.url.path.startswith("/api/"):
            ms = (time.perf_counter() - start) * 1000
            xray.append_request(request.method, request.url.path, response.status_code, ms)
        return response

    @app.get("/api/v1/meta")
    def meta() -> dict[str, Any]:
        return {"stub_mode": stub_mode, "app_name": app_config.app_name}

    @app.get("/api/v1/health")
    def health() -> dict[str, Any]:
        return {"status": "ok", "database": database.health(), "stub_mode": stub_mode}

    @app.get("/api/v1/hub/summary")
    def hub_summary() -> dict[str, Any]:
        return hub.get_hub_summary()

    @app.get("/api/v1/providers/{provider_id}/console")
    def provider_console(provider_id: str) -> dict[str, Any]:
        try:
            return hub.get_provider_console(provider_id)
        except BaicError as exc:
            raise HTTPException(status_code=404, detail=exc.message) from exc

    @app.post("/api/v1/providers/{provider_id}/operations/{op_id}")
    def run_operation(provider_id: str, op_id: str, body: OperationRequest) -> dict[str, Any]:
        try:
            return hub.run_operation(provider_id, op_id, body.context)
        except BaicError as exc:
            raise HTTPException(status_code=400, detail=exc.message) from exc

    @app.post("/api/v1/proxy/{provider_id}/completions")
    def proxy_completion(provider_id: str, body: ProxyRequest) -> dict[str, Any]:
        try:
            bridge = registry.get(provider_id)
            tokens = estimate_tokens(body.prompt)
            with database.session() as session:
                from db.repository import EnatRepository

                repo = EnatRepository(session)
                snap = repo.latest_metric(provider_id, body.hierarchy_path or None)
                if snap:
                    decision = evaluate_route(
                        snap.tpm_usage or 0,
                        snap.tpm_ceiling or 0,
                        snap.accumulated_cost or 0.0,
                        snap.spend_cap or 15.0,
                        tokens,
                        model_id=body.model,
                    )
                else:
                    decision = evaluate_route(0, 0, 0.0, 15.0, tokens, model_id=body.model)
            result = bridge.forward_request(body.hierarchy_path, body.model_dump())
            return {"decision": decision, "result": result}
        except BaicError as exc:
            raise HTTPException(status_code=400, detail=exc.message) from exc

    @app.get("/api/v1/admin/providers")
    def admin_providers() -> dict[str, Any]:
        reg = load_provider_registry()
        return {
            "default_hierarchy": reg.get("default_hierarchy"),
            "providers": reg.get("providers", {}),
            "loaded": registry.list_ids(),
            "stub_mode": stub_mode,
        }

    @app.get("/api/v1/capability/matrix")
    def capability_matrix() -> dict[str, Any]:
        return capability.full_matrix()

    @app.get("/api/v1/capability/families")
    def capability_families() -> dict[str, Any]:
        return {"families": capability.model_families()}

    @app.get("/api/v1/capability/platforms/{platform_id}/models")
    def platform_models(platform_id: str) -> dict[str, Any]:
        try:
            return capability.platform_models(platform_id)
        except BaicError as exc:
            raise HTTPException(status_code=404, detail=exc.message) from exc

    @app.patch("/api/v1/capability/platforms/{platform_id}/models/{model_id}")
    def patch_platform_model(platform_id: str, model_id: str, body: MatrixPatchBody) -> dict[str, Any]:
        try:
            patch = body.model_dump(exclude_none=True)
            return capability.patch_model(platform_id, model_id, patch)
        except BaicError as exc:
            raise HTTPException(status_code=400, detail=exc.message) from exc

    @app.get("/api/v1/xray/runtime")
    def xray_runtime() -> dict[str, Any]:
        with database.session() as session:
            from db.repository import EnatRepository

            repo = EnatRepository(session)
            dirt = [{"level": e.level, "message": e.message} for e in repo.list_dirt_events(limit=50)]
        payload = xray.snapshot(dirt_events=dirt)
        payload["stub_mode"] = stub_mode
        if stub_mode:
            payload["stub_manifest"] = {
                "stub_mode": True,
                "bridges": registry.stub_manifests(),
                "scaffold": validate_scaffold().errors or ["ok"],
            }
        return payload

    @app.post("/api/v1/xray/event")
    def xray_event(body: XRayEventBody) -> dict[str, Any]:
        xray.append(body.level, body.message, source=body.source, **body.context)
        return {"ok": True}

    @app.post("/api/v1/actions")
    def record_action(body: ActionEventBody) -> dict[str, Any]:
        if body.schema_name != "merit.telemetry.action.v1":
            raise HTTPException(status_code=422, detail="unsupported action schema")
        if body.api_call_made != (body.transport == "api"):
            raise HTTPException(status_code=422, detail="api_call_made must match transport=api")
        with database.session() as session:
            from db.repository import EnatRepository
            from sqlalchemy.exc import IntegrityError

            repo = EnatRepository(session)
            values = body.model_dump(exclude_none=True, by_alias=True)
            values.pop("schema", None)
            values["occurred_at"] = body.occurred_at or datetime.now(UTC)
            try:
                repo.add_action_event(**values)
                session.commit()
            except IntegrityError:
                session.rollback()
                return {"ok": True, "duplicate": True, "event_id": body.event_id}
        return {"ok": True, "duplicate": False, "event_id": body.event_id}

    @app.get("/api/v1/actions")
    def list_actions(limit: int = 100) -> dict[str, Any]:
        with database.session() as session:
            from db.repository import EnatRepository
            events = EnatRepository(session).list_action_events(limit)
            return {"schema": "merit.telemetry.action.v1", "events": [
                {"event_type": e.event_type, "event_id": e.event_id, "utility_id": e.utility_id,
                 "quantity": e.quantity, "transport": e.transport, "api_call_made": e.api_call_made,
                 "outcome": e.outcome, "cost_usd": e.cost_usd, "cost_source": e.cost_source,
                 "occurred_at": e.occurred_at.isoformat()}
                for e in events
            ]}

    @app.get("/api/v1/config/scaffold-status")
    def scaffold_status() -> dict[str, Any]:
        report = validate_scaffold()
        return {"ok": report.ok, "errors": report.errors, "warnings": report.warnings}

    ui_dist = get_repo_root() / "web" / "dist"
    if ui_dist.is_dir():
        app.mount("/", StaticFiles(directory=str(ui_dist), html=True), name="ui")

    return app
