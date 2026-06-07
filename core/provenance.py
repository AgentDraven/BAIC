"""Build provenance metadata for UI hotspots (MERIT §II.K)."""

from __future__ import annotations

from typing import Any


def provenance(
    *,
    source: str,
    summary: str,
    stored_in: str | None = None,
    input_ref: str | None = None,
    output_ref: str | None = None,
    feeds: str | None = None,
    run_timing: str | None = None,
    learn_more_url: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    out: dict[str, Any] = {
        "source": source,
        "summary": summary,
    }
    if stored_in:
        out["stored_in"] = stored_in
    if input_ref:
        out["input"] = input_ref
    if output_ref:
        out["output"] = output_ref
    if feeds:
        out["feeds"] = feeds
    if run_timing:
        out["run_timing"] = run_timing
    if learn_more_url:
        out["learn_more_url"] = learn_more_url
    if extra:
        out.update(extra)
    return out


def field(value: Any, prov: dict[str, Any]) -> dict[str, Any]:
    return {"value": value, "provenance": prov}


def metric_provenance(
    *,
    has_snapshot: bool,
    stub_mode: bool,
    secrets_configured: bool,
    table: str = "metric_snapshots",
    seed_ref: str = "db/seed.py",
) -> dict[str, Any]:
    if not has_snapshot:
        return provenance(
            source="none",
            summary="No metric row for this provider. Connect credentials or run with --stub.",
            stored_in="—",
            input_ref="Provider bridge sync (not yet implemented)",
            output_ref="Hub card / Spoke blocks",
            learn_more_url="BAIC docs/CONCEPTS_GUIDE.md#metrics",
        )
    if stub_mode:
        return provenance(
            source="stub_seed",
            summary=f"Demo metric from {seed_ref}, loaded when BAIC starts with --stub.",
            stored_in=f"sqlite://{table}",
            input_ref=seed_ref,
            output_ref="Hub KPI strip and provider cards",
            run_timing="Once at DB initialize in stub mode",
            extra={"stub": True},
        )
    if not secrets_configured:
        return provenance(
            source="stale_or_unverified",
            summary=(
                "SQLite has metric rows but provider credentials are not configured. "
                "Likely leftover demo seed from a prior --stub run — delete output/baic_state.db "
                "for a clean live state."
            ),
            stored_in=f"sqlite://{table}",
            input_ref="Prior --stub session or manual DB row",
            output_ref="Hub / Spoke display",
            learn_more_url="BAIC docs/USER_GUIDE.md#stub-vs-live",
            extra={"stale_seed_warning": True},
        )
    return provenance(
        source="sqlite_snapshot",
        summary="Latest metric_snapshots row for this provider (local cache; live API sync TBD).",
        stored_in=f"sqlite://{table}",
        input_ref="Provider bridge metric sync",
        output_ref="Hub card and Spoke blocks",
        run_timing="On hub refresh / console open",
    )


def cfg_provenance(
    path: str,
    summary: str,
    *,
    learn_more_url: str | None = None,
) -> dict[str, Any]:
    return provenance(
        source="cfg",
        summary=summary,
        stored_in=path,
        input_ref=f"Operator-maintained {path}",
        output_ref="UI declaration (not live-verified unless noted)",
        learn_more_url=learn_more_url,
    )
