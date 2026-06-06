"""Demo seed data aligned with UX mockups (Hub + Google Spoke)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from db.models import DirtEvent, MetricSnapshot, ProviderEntity


def seed_demo_data(session: Session) -> None:
    entities = [
        # Google
        ("google_cloud", "billing_account", "Merit LLC Billing", "google/billing/merit-llc", None),
        ("google_cloud", "project", "M4O-Venture", "google/billing/merit-llc/project/m4o-venture", "google/billing/merit-llc"),
        ("google_cloud", "byok", "AI Studio Key", "google/billing/merit-llc/project/m4o-venture/byok/studio", "google/billing/merit-llc/project/m4o-venture"),
        ("google_cloud", "project", "Merit-SWDAR", "google/billing/merit-llc/project/merit-swdar", "google/billing/merit-llc"),
        # Azure
        ("microsoft_azure", "billing_account", "Founders Hub Grant", "azure/billing/founders", None),
        ("microsoft_azure", "project", "OpenAI Resource Group", "azure/billing/founders/project/openai-rg", "azure/billing/founders"),
        # AWS
        ("amazon_aws", "billing_account", "Activate Founders", "aws/billing/activate", None),
        # OCI
        ("oracle_oci", "billing_account", "Always Free Tenancy", "oci/billing/tenancy", None),
        ("oracle_oci", "compartment", "Agent Pool", "oci/billing/tenancy/compartment/agent", "oci/billing/tenancy"),
        ("oracle_oci", "compute_pool", "Ampere Pool", "oci/billing/tenancy/compartment/agent/pool/ampere", "oci/billing/tenancy/compartment/agent"),
        # Consumer
        ("cursor_pro", "subscription", "Cursor Pro", "cursor/sub/pro", None),
        ("github_copilot", "subscription", "Copilot Education", "copilot/sub/edu", None),
        ("google_one_ai", "subscription", "Google One AI Premium", "google-one/sub/premium", None),
    ]
    for provider_id, tier, name, path, parent in entities:
        session.add(
            ProviderEntity(
                provider_id=provider_id,
                tier=tier,
                name=name,
                hierarchy_path=path,
                parent_path=parent,
                active=True,
            )
        )

    metrics = [
        ("google_cloud", "google/billing/merit-llc/project/m4o-venture", "token_and_promo_cash", 420000, 1000000, 3.77, 15.0, 1040.0, "2027-03-17", None, None, None, "active"),
        ("microsoft_azure", "azure/billing/founders/project/openai-rg", "token_and_promo_cash", 12000, 500000, 0.0, 15.0, 1000.0, "2026-12-31", None, None, None, "ready"),
        ("amazon_aws", "aws/billing/activate", "token_and_promo_cash", 0, 0, 0.0, 15.0, 0.0, None, None, None, None, "unclaimed"),
        ("oracle_oci", "oci/billing/tenancy/compartment/agent/pool/ampere", "compute_capacity", None, None, None, None, None, None, None, 42.0, 18.5, "active"),
        ("cursor_pro", "cursor/sub/pro", "allowance_percent", None, None, None, None, None, None, 5.0, None, None, "canceled_active"),
        ("github_copilot", "copilot/sub/edu", "allowance_tokens", None, None, None, None, None, None, None, None, None, "active_free"),
        ("google_one_ai", "google-one/sub/premium", "consumer_credits", None, None, None, None, None, None, None, None, None, "active"),
    ]
    for row in metrics:
        session.add(
            MetricSnapshot(
                provider_id=row[0],
                hierarchy_path=row[1],
                metrics_profile=row[2],
                tpm_usage=row[3],
                tpm_ceiling=row[4],
                accumulated_cost=row[5],
                spend_cap=row[6],
                promo_balance=row[7],
                promo_expires=row[8],
                allowance_percent=row[9],
                cpu_percent=row[10],
                memory_gb_free=row[11],
                status=row[12],
            )
        )

    for msg in [
        "Initializing unified backend authentication layer...",
        "Mapping consumer endpoints to local SQLite database schema allocations...",
        "Provider registry loaded from cfg/provider_registry.json",
        "Hub summary ready — 7 providers enabled",
    ]:
        session.add(DirtEvent(level="SYSTEM", message=msg))
