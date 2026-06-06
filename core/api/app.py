"""FastAPI application factory."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from db.ports import DatabasePort
from db.sqlite_backend import create_database
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from core.arbitrage import estimate_tokens, evaluate_route
from core.config_loader import AppConfig, load_provider_registry
from core.error_codes import BaicError
from core.hub_service import HubService
from core.path_resolver import get_repo_root
from core.provider_loader import ProviderRegistry


class OperationRequest(BaseModel):
    context: dict[str, Any] = Field(default_factory=dict)


class ProxyRequest(BaseModel):
    prompt: str
    model: str = "gemini-2.5-flash"
    hierarchy_path: str = ""


class AppState:
    config: AppConfig
    db: DatabasePort
    registry: ProviderRegistry
    hub: HubService


def create_app(config: AppConfig | None = None, db: DatabasePort | None = None) -> FastAPI:
    app_config = config or AppConfig.load()
    database = db or create_database(app_config)
    database.initialize()
    registry = ProviderRegistry(load_provider_registry())
    hub = HubService(database, registry)
    state = AppState()
    state.config = app_config
    state.db = database
    state.registry = registry
    state.hub = hub

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

    @app.get("/api/v1/health")
    def health() -> dict[str, Any]:
        return {"status": "ok", "database": database.health()}

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
                    )
                else:
                    decision = {"action": "forward"}
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
        }

    ui_dist = get_repo_root() / "web" / "dist"
    if ui_dist.is_dir():
        app.mount("/", StaticFiles(directory=str(ui_dist), html=True), name="ui")

    return app
