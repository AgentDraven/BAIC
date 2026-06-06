# BAIC TokenMaxxing Control Plane — Unified PRD / HLD / LLD

**Project:** TokenMaxxing2Zero Tracker (T2Z) · **Baseline:** BAIC-DIRT Alpha-0.1  
**Document role:** Single source for product requirements, high-level design, low-level design, UX input, and persona-specific entry points.

---

### The Credo (System Prime Directive)

> Isolate the workspace. Protect the capital. Move fluidly across infrastructure lines.  
> Never pay for what the enterprise provides for free.  
> We build **BAIC (Bay Area Inference Club)**. We execute **TokenMaxxing to Zero$**.  
> Feed the data machines clean markdown. Bind the entities: **DIRT** has no dots.

---

## Document map (read this first)

| Persona | Start here | Primary capabilities |
|---------|------------|----------------------|
| **Operator / User** | [§1.1 User](#11-user-operator) · README · Global Ledger UI | Portfolio view, provider drill-down, spend/runway, route troubleshooting |
| **Admin** | [§1.2 Admin](#12-admin) · `cfg/provider_registry.json` · Admin console | Add providers, configure Billing → Project → BYOK hierarchies, entitlements |
| **Developer** | [§1.3 Developer](#13-developer) · [§7 Bridge extension](#7-developer-guide-extending-providers-via-bridge) | Implement `bridge/<provider>/`, register adapters, extend core without embedding vendor APIs |

---

## 1. User personas & documentation paths

<a id="personas"></a>

### 1.1 User (Operator)

**Who:** Solo operator, SMB founder, or consultant running daily inference arbitrage across subscriptions and cloud grants.

**Goal:** See unified liquidity and runway at a glance; drill into one provider console; act on alerts (swap, cap, claim voucher) without reading config files.

**Documentation path**

1. `README.md` — 2-minute orientation and `merit.ps1` workflow  
2. **This document §2–§3** — what the control plane shows and why  
3. `BAIC docs/BOOTSTRAPPING.md` — repo bootstrap and check-in  
4. `BAIC docs/USER_GUIDE.md` — operator workflows (Global Ledger → Provider Console → actions)  
5. **UI:** Screen 1 Global Multi-Cloud Ledger (Hub) → Screen 2 Provider Console (Spoke)

**Capabilities provided**

| Capability | Where |
|------------|--------|
| Global portfolio runway, out-of-pocket, total liquidity | Hub dashboard |
| Consumer subscription cards (Cursor, Copilot, Google One AI) | Hub — frontends section |
| Infrastructure extraction nodes (Google, Azure, AWS, OCI) | Hub — infra section |
| Enter provider-specific console (key swap, TPM, promo pools) | Spoke — per provider |
| Dual-axis cost gauge, TPM saturation, auto-swap status | Spoke — e.g. Google Block B |
| Troubleshoot sync / route via Cline / claim dev voucher | Hub card actions (wired to bridge ops) |
| Real-time progress via WebSocket or polling | Control plane API |

**Out of scope for User persona:** editing `cfg/provider_registry.json`, creating bridge modules, changing hierarchy schema.

---

<a id="admin-persona"></a>

### 1.2 Admin

**Who:** Human Bala or designated infra owner configuring providers, billing linkages, and BYOK credentials.

**Goal:** Add or enable model/cloud providers **without code** when possible; when hierarchy differs from default, declare it in JSON; delegate code-only gaps to Developer.

**Documentation path**

1. **This document §6** — provider registry and hierarchy model  
2. `cfg/provider_registry.example.json` — copy to `cfg/provider_registry.json`  
3. `BAIC docs/CONFIG_REFERENCE.md` — field-by-field registry + eNAT columns  
4. Future: `core/admin_console.py` — backend admin UI for provider CRUD  
5. MERIT §I.B — `cfg/` is SSOT; commit tracked JSON with releases

**Capabilities provided**

| Capability | Mechanism |
|------------|-----------|
| Register a new provider (display name, kind, console route) | `provider_registry.json` → `providers.<id>` |
| Set hierarchy chain per provider | `hierarchy[]` array — default `["billing_account","project","byok"]` |
| Document provider-specific tier naming | `hierarchy_notes` (human + agent readable) |
| Map billing account → n projects → n BYOK slots | Admin console or JSON + SQLite eNAT rows (cumulative, never delete) |
| Enable/disable provider on Hub | `enabled: true/false` (future field) |
| Attach bridge module when code required | `bridge_module`: `bridge/<provider>` |
| Secrets / API keys | `.env.local` or gitignored `cfg/secrets.json` — **not** in registry |

**Default hierarchy (most hyperscalers & LLM APIs)**

```
Billing Account (n) → Project (n) → BYOK (n)
```

Each level may have **n** sibling items. Admin creates rows in SQLite eNAT keyed by provider + hierarchy path.

**When hierarchy differs:** override `hierarchy` in `provider_registry.json` (see §6). Examples:

- **OCI:** `billing_account → compartment → compute_pool` (no BYOK; capacity metrics)  
- **Consumer frontends:** `subscription → seat|credit_pool → routing_profile`  
- **Google:** same default chain but **two UI blocks** (AI Studio vs Vertex) under one provider card

Admin does **not** edit Python in `core/` for provider-specific API calls — that is Developer + `bridge/`.

---

<a id="developer-persona"></a>

### 1.3 Developer

**Who:** Agent or engineer implementing proxy routing, bridge adapters, UI scaffolding, and tests.

**Goal:** Extend providers in isolated bridge packages; keep `core/` vendor-agnostic; satisfy MERIT closeout (VERSION, tag, tests).

**Documentation path**

1. **This document §4–§5, §7** — HLD/LLD and bridge contract  
2. `bridge/README.md` — folder convention  
3. `MERIT.instructions` §I.A (layout), §III (config-driven design), bridge pattern  
4. `BAIC docs/TECHNICAL_HLD_LLD.md` — excerpt or mirror of §4–§5 when doc splits  
5. `test_baic.py` / `tests/` — harness for D1–D5 (MERIT §XIV)

**Capabilities provided**

| Capability | Mechanism |
|------------|-----------|
| Add specialized provider integration | New package `bridge/<provider>/` |
| Implement auth, quota read, swap, forward | Bridge adapter implementing `ProviderBridge` protocol (§7) |
| Register adapter | `bridge/<provider>/__init__.py` exports + registry `bridge_module` |
| Extend metrics (token vs compute vs allowance) | `metrics_profile` in registry + bridge `get_metrics()` |
| Hyperscaler **and** LLM-only providers | Same bridge folder pattern — no vendor logic in `core/phase_*.py` |
| UI console template | Reuse Spoke layout; provider-specific panels via registry + bridge metadata |

**Hard rules (MERIT-aligned)**

- Config flows **cfg/ → core/service_manager → bridge/** — not hardcoded in phases  
- API keys in `llm_providers.json` / `.env.local` — never in bridge source  
- Cumulative SQLite — no row/column deletes on state transition  
- One annotated tag closeout via `merit.ps1 mXin` per MERIT §VIII.F  

---

## 2. UX requirements, input spec & critique

<a id="ux-input"></a>

### 2.1 UX input summary (Hub-and-Spoke control plane)

The prior PRD described a **single-screen** Deep Execution Panel (Google-only). The approved UX direction is a **two-tier Hub-and-Spoke** layout for the **TokenMaxxing Control Plane**:

| Screen | Name | Purpose |
|--------|------|---------|
| **Screen 1** | Global Multi-Cloud Ledger (Hub) | Portfolio: subscriptions, grants, vouchers, infra nodes — unified liquidity view |
| **Screen 2** | Provider Arbitrage Console (Spoke) | Provider-specific: key swap, SQLite-backed state, TPM/cost gauges — entered from Hub card |

**Hub sections (from mockup input)**

1. **Global KPI strip** — estimated runway, out-of-pocket/month, total active liquidity  
2. **Consumer frontends & subscriptions** — Cursor Pro, GitHub Copilot Education, Google One AI Premium (status, cap, routing, actions)  
3. **Infrastructure extraction nodes** — Google, Azure, AWS, OCI cards with balance, projects, posture, CTA  
4. **Entity registry pipeline (DIRT engine)** — system log strip for auth mapping / SQLite allocation  

**Google Spoke split (critical)**

- **Block A:** Google AI Studio (public sandbox) — project isolation, TPM ceiling, 2026 commercial matrix  
- **Block B:** GCP Vertex AI (enterprise) — promo cash pools, expiration, swap sequencer guardrails  
- **Dual-axis cost gauge (Recharts)** — hard cap line, accumulated cost, promo discount offset  

**Other hyperscaler spokes (same template)**

- **Azure:** Founders Hub grant; custom OpenAI endpoint schema; Azure token pricing + safety cutoff  
- **AWS Bedrock:** Activate credits; `AWS_ACCESS_KEY_ID` / secret config lines; cross-vendor model usage (Claude, Llama)  
- **OCI:** Always Free — CPU/RAM utilization for Ollama/cron, not API $ tracking  

**Front-end state model (from input)**

```typescript
type ActiveScreen =
  | 'GLOBAL_LEDGER_HUB'
  | 'GOOGLE_CONSOLE'
  | 'AZURE_CONSOLE'
  | 'AWS_CONSOLE'
  | 'OCI_CONSOLE'
  | 'CONSUMER_CONSOLE';

interface WorkspaceProps {
  currentScreen: ActiveScreen;
  globalLiquidity: number;
}
```

Status badge semantics: `ACTIVE_FREE`, `CANCELED_ACTIVE`, `UNCLAIMED`, etc.

---

<a id="ux-critique"></a>

### 2.2 UX critique (strengths, gaps, design decisions)

**Strengths — adopt**

- **Hub-and-Spoke fixes the structural gap** in PRD v0.1: macro portfolio vs micro provider plumbing are separate cognitive layers.  
- **Google AI Studio vs Vertex split** matches real auth, pricing, and TPM mechanics — must remain two blocks under one Hub card.  
- **Scannable ASCII mockups** are suitable agent scaffolding for Next.js App Router + Tailwind.  
- **Per-card actions** (Troubleshoot Sync, Route via Cline, Claim Voucher) align with operator persona jobs-to-be-done.  
- **DIRT entity registry strip** reinforces SSOT narrative and gives observability during sync.

**Gaps — must address in implementation**

| Gap | Resolution |
|-----|------------|
| **Incompatible units in “Total Liquidity $2,120”** | Hub sums **normalized USD equivalents** only; OCI shows compute capacity separately (`metrics_profile: compute_capacity`). |
| **Consumer vs infra entity types differ** | Unified ledger model with `kind: consumer_frontend \| hyperscaler` in registry (§6). |
| **BYOK / credential wizard absent from mockups** | Admin console + Spoke “Credentials” panel bound to hierarchy leaf tier. |
| **No empty / error / degraded states** | Each card: loading, unclaimed, auth expired, bridge offline — with MERIT fail-closed copy. |
| **“Hidden backdoor tokens”** | Remove from production UI; use “unmapped entitlements” or “discovered credentials (review)”. |
| **Navigation IA** | Persistent `[BACK TO HUB]` + breadcrumb: `Hub › Google Ecosystem › Vertex`. |
| **Refresh strategy unspecified** | Hub: 30–60s poll or WS; Spoke TPM/cost: sub-5s WS when proxy active. |
| **Accessibility / mobile** | Hub read-only OK on mobile; Spoke editing desktop-first for Alpha-0.1. |
| **Action → backend mapping** | Each CTA maps to `bridge/<provider>/ops.py` handler id (LLD §5.3). |

**Verdict:** The input spec **matches** the intended visual layout and system perspective. Adopt Hub-and-Spoke as canonical; fold prior §4 single-screen gauge description into Spoke templates.

---

## 3. Product requirements (PRD)

### 3.1 Problem statement

Operators juggle overlapping retail AI subscriptions, founder credits, and multi-project cloud keys. T2Z is an active **quota-routing proxy and semantic optimization engine** that intercepts IDE/script traffic, enforces spend/TPM guardrails, and surfaces a **multi-cloud control plane** for arbitrage decisions.

### 3.2 Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Global Ledger Hub aggregating all registered providers | P0 |
| FR-2 | Provider Spoke consoles with shared layout, provider-specific panels | P0 |
| FR-3 | Default hierarchy Billing Account → Project → BYOK (n at each level) | P0 |
| FR-4 | Per-provider hierarchy override via `cfg/provider_registry.json` | P0 |
| FR-5 | Bridge-isolated vendor integration under `bridge/<provider>/` | P0 |
| FR-6 | Admin add/configure providers without code when JSON suffices | P0 |
| FR-7 | Real-time TPM tracking + 95% auto project swap (Google reference loop) | P0 |
| FR-8 | Dual-axis cost chart with promo discount offset | P1 |
| FR-9 | Cumulative SQLite eNAT — no destructive deletes | P0 |
| FR-10 | AEO content pipeline (markdown + entity binding + readme embed) | P2 |

### 3.3 Non-functional requirements

- **Security:** BYOK and secrets never in git; fail-closed on auth errors  
- **Performance:** FastAPI async proxy; local SQLite for state  
- **Extensibility:** New provider = registry entry + optional bridge package  
- **Observability:** DIRT pipeline log + structured bridge events  
- **MERIT compliance:** cfg SSOT, `run_baic.py` / `test_baic.py` entry points, versioned closeout  

### 3.4 Out of scope (Alpha-0.1)

- Multi-tenant SaaS billing (MERIT D5 adapters stub only)  
- Mobile-native apps  
- Automatic voucher claiming without explicit operator confirm  

---

## 4. High-level design (HLD)

### 4.1 System context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCREEN 1: GLOBAL LEDGER HUB (Next.js)                 │
│   Consumer cards │ Infra nodes │ KPI strip │ DIRT registry strip          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ click provider card
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              SCREEN 2: PROVIDER SPOKE CONSOLE (Next.js)                    │
│   Block A (e.g. AI Studio) │ Block B (e.g. Vertex) │ Recharts gauges    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ REST / WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CENTRAL ARBITRAGE CORE (FastAPI)                     │
│   Token parser │ Quota engine │ Router │ Admin API │ Registry loader    │
└───────┬─────────────────────────┬──────────────────────────┬────────────┘
        │                         │                          │
        ▼                         ▼                          ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────────┐
│ SQLite eNAT   │         │ bridge/       │         │ External APIs     │
│ (cumulative)  │         │ <provider>/   │         │ Google, Azure,    │
└───────────────┘         └───────────────┘         │ AWS, OCI, LLMs…   │
                                                    └───────────────────┘
```

### 4.2 Layer responsibilities

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Control plane UI | Next.js, Tailwind, Recharts | Hub + Spoke; persona-aware nav |
| Arbitrage core | FastAPI | Proxy, routing, registry, admin API |
| Registry | `cfg/provider_registry.json` | Provider metadata, hierarchy, bridge pointer |
| State | SQLite + SQLAlchemy | eNAT cumulative config + live metrics |
| Bridges | Python `bridge/<provider>/` | Vendor-specific auth, quota, forward, ops |
| Secrets | `.env.local`, `cfg/secrets.json` | BYOK material — gitignored |

### 4.3 Data flow (request path)

1. IDE sends prompt to local proxy endpoint  
2. Core loads active project + BYOK from eNAT via registry hierarchy  
3. Token preflight + cost projection (2026 matrix for Gemini; bridge supplies others)  
4. Quota evaluation — swap, freeze, or delay per §3.1 loop  
5. **Bridge** forwards to vendor API with correct auth shape  
6. Response updates rolling TPM / accumulated cost in SQLite  
7. WebSocket pushes gauge updates to Spoke UI  

### 4.4 Security (HLD)

- BYOK stored encrypted at rest (Alpha: file-backed secrets; production: OS keychain)  
- Bridge modules receive secret **handles**, not raw keys in logs  
- Admin mutations require authenticated admin console session (future)  

---

## 5. Low-level design (LLD)

### 5.1 Repository layout (MERIT §I.A + BAIC extensions)

```
BAIC/
├── run_baic.py
├── test_baic.py
├── core/                      # Vendor-agnostic arbitrage, admin, eNAT ORM
├── bridge/                    # One folder per provider (§7)
│   ├── README.md
│   ├── base.py                # ProviderBridge protocol
│   ├── google/
│   ├── azure/
│   ├── aws/
│   ├── oci/
│   └── …
├── cfg/
│   ├── provider_registry.example.json
│   └── provider_registry.json # Admin SSOT (tracked if no secrets)
├── BAIC docs/input/BAIC_PRD.md  # This document
└── …
```

### 5.2 eNAT schema extensions (multi-provider)

Extend §legacy table with:

| Super Category | Entity Field | Purpose |
|----------------|--------------|---------|
| Provider | `provider_id` | Registry key, e.g. `google_cloud` |
| Hierarchy | `hierarchy_path` | JSON path, e.g. `billing/merit-llc/project/m4o-venture/byok/key-1` |
| Provider | `metrics_profile` | `token_and_promo_cash` \| `compute_capacity` \| `allowance_percent` |
| UI | `console_screen` | Maps to `ActiveScreen` enum |

All prior fields (`billing_account_name`, `gcp_project_id`, `api_key_string`, `current_tpm_usage`, `monthly_spend_cap`, `promo_cash_balance`, etc.) remain — scoped by `provider_id` + `hierarchy_path`.

### 5.3 Bridge operation IDs (UI CTA mapping)

| Operation ID | Typical UI trigger |
|--------------|-------------------|
| `troubleshoot_sync` | Cursor card — Troubleshoot Sync |
| `route_via_cline` | Copilot card — Route via Cline |
| `claim_dev_voucher` | Google One — Claim $40 Dev Voucher |
| `enter_provider_console` | Infra card — click through to Spoke |
| `submit_activation` | AWS — Submit Activation Request |
| `monitor_background` | OCI — Monitor Background Task |

Each bridge implements `supported_operations() -> list[str]` and `run_operation(op_id, context)`.

### 5.4 API sketch (core ↔ UI)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/hub/summary` | KPI strip + card list |
| GET | `/api/v1/providers/{id}/console` | Spoke payload |
| WS | `/api/v1/stream/metrics` | TPM/cost live updates |
| GET | `/api/v1/admin/providers` | Admin list (registry merge eNAT) |
| PUT | `/api/v1/admin/providers/{id}` | Admin update hierarchy instance |
| POST | `/api/v1/proxy/{provider_id}/completions` | Intercepted inference (internal) |

### 5.5 Prescriptive routing loop (reference — Google)

```python
def evaluate_and_route_request(payload, current_project_id):
    estimated_tokens = calculate_local_token_weight(payload)
    project_state = db.get_project_state(current_project_id)

    if (project_state.accumulated_cost + (estimated_tokens * PRICE_PER_TOKEN)) >= project_state.monthly_spend_cap:
        return trigger_hard_safety_freeze(current_project_id)

    if (project_state.rolling_tpm + estimated_tokens) >= (0.95 * project_state.max_tpm_ceiling):
        alternative_project = db.get_available_isolated_project(exclude_id=current_project_id)
        if alternative_project:
            return forward_via_bridge("google_cloud", payload, alternative_project)
        return delay_execution_sequence(seconds_to_reset=60)

    return forward_via_bridge("google_cloud", payload, project_state)
```

Vendor-specific forward logic lives in `bridge/google/`, not inline.

### 5.6 UI components (LLD)

| Component | Screen | Notes |
|-----------|--------|-------|
| `GlobalLiquidityStrip` | Hub | Runway, OOP, liquidity (USD-normalized) |
| `ProviderCardGrid` | Hub | Sections: consumer / infra |
| `DirtRegistryStrip` | Hub | Scrollable system events |
| `ProviderConsoleShell` | Spoke | Back nav, summary header, active route |
| `ProductBlock` | Spoke | Repeatable Block A/B pattern |
| `DualAxisCostGauge` | Spoke | Recharts bar + cap line + offset label |
| `HeroQuotaGauge` | Spoke | TPM dial — green / amber / red |

---

## 6. Provider registry & hierarchy configuration

<a id="provider-registry"></a>

**File:** `cfg/provider_registry.json` (example: `cfg/provider_registry.example.json`)

### 6.1 Schema (conceptual)

```json
{
  "default_hierarchy": ["billing_account", "project", "byok"],
  "providers": {
    "<provider_id>": {
      "display_name": "string",
      "kind": "hyperscaler | consumer_frontend | llm_api",
      "console_screen": "GOOGLE_CONSOLE | …",
      "hierarchy": ["billing_account", "project", "byok"],
      "hierarchy_notes": "string",
      "bridge_module": "bridge/google",
      "metrics_profile": "token_and_promo_cash | compute_capacity | allowance_percent | consumer_credits",
      "enabled": true,
      "products": ["ai_studio", "vertex_ai"]
    }
  }
}
```

### 6.2 When to override `hierarchy`

| Provider | Hierarchy chain | Reason |
|----------|-----------------|--------|
| Default hyperscaler / LLM | `billing_account → project → byok` | Standard cloud + API key model |
| Google (UI) | Same chain, two **products** in Spoke | AI Studio vs Vertex mechanics |
| OCI | `billing_account → compartment → compute_pool` | No BYOK; capacity tier |
| Cursor / Copilot | `subscription → seat → routing_profile` | Retail subscription model |
| Google One AI | `subscription → credit_pool → routing_profile` | Consumer credits middle tier |

If sequence differs from `default_hierarchy`, **Admin must set `hierarchy[]` explicitly** — agents must not assume three-tier BYOK for every card.

### 6.3 Admin workflow (no code)

1. Copy `provider_registry.example.json` → `provider_registry.json`  
2. Add provider block with correct `hierarchy` and `bridge_module`  
3. If `bridge_module` points to missing package → file ticket for Developer (§7)  
4. Create eNAT rows for each billing account / project / BYOK instance  
5. Store secrets in `.env.local` keyed by hierarchy path  
6. Restart core or hot-reload registry; verify card appears on Hub  
7. Closeout: `merit.ps1 mXin` with cfg + docs  

---

## 7. Developer guide: extending providers via `bridge/`

<a id="bridge-extension"></a>

### 7.1 Insight (canonical pattern)

**Every hyperscaler and LLM provider uses its own bridge code** for specialized extensions (auth shape, quota APIs, swap rules, OCI compute vs token metrics). That code lives in **`bridge/<provider>/`**, compliant with MERIT:

- **No vendor SDK calls in `core/phase_*.py`**  
- **Config from `cfg/`**; secrets from env / gitignored files  
- **Function signatures accept config** (MERIT §III.D)  
- **Service manager dispatches** to registered bridge  

This matches MERIT’s `bridge/[service].py` pattern, extended to **one directory per provider** for multi-file adapters (auth, forward, ops, metrics).

### 7.2 `ProviderBridge` protocol (`bridge/base.py`)

```python
class ProviderBridge(Protocol):
    provider_id: str

    def load_config(self, registry_entry: dict, secrets: dict) -> None: ...

    def hierarchy_tiers(self) -> list[str]:
        """Return registry hierarchy or default."""

    def get_metrics(self, hierarchy_path: str) -> dict: ...

    def forward_request(self, hierarchy_path: str, payload: dict) -> dict: ...

    def supported_operations(self) -> list[str]: ...

    def run_operation(self, op_id: str, context: dict) -> dict: ...
```

### 7.3 Adding a new provider (checklist)

1. **Registry first** — Admin adds `providers.<id>` in JSON with `hierarchy` + `bridge_module`  
2. **Scaffold** — `bridge/<provider>/__init__.py` exporting `Bridge` class  
3. **Implement** — auth, metrics, forward, operations per §5.3  
4. **Register loader** — `core/provider_loader.py` imports `bridge_module` dynamically  
5. **Tests** — `tests/test_bridge_<provider>.py` with mocked HTTP  
6. **UI** — add `console_screen` to Next.js enum + Spoke template blocks from `products[]`  
7. **Docs** — update this PRD §6 table + CHANGELOG  

### 7.4 Example folder layout

```
bridge/google/
├── __init__.py          # exports GoogleBridge
├── ai_studio.py         # Block A — API key forward
├── vertex.py            # Block B — OAuth ADC, promo pools
├── metrics.py           # TPM, billing API reads
└── ops.py               # claim_dev_voucher, etc.
```

### 7.5 Code vs config boundary

| Change | Who | Artifact |
|--------|-----|----------|
| New provider with standard REST forward | Admin + Dev | JSON + thin bridge wrapper |
| New auth scheme (OAuth device, SigV4) | Developer | `bridge/<provider>/auth.py` |
| Different hierarchy depth | Admin | `hierarchy[]` in JSON only |
| New Hub card action | Developer | `ops.py` + UI CTA wire |

---

## 8. Universal eNAT infrastructure schema (database layer)

The SQLite store remains a **cumulative** master configuration — columns and rows are **never deleted** during state transitions.

### Core fields (retained from Alpha-0.1)

| Super Category | Entity Field | Purpose |
|----------------|--------------|---------|
| System Branding | `broadcast_channel`, `series_title`, `engine_identity` | BAIC / TokenMaxxing / DIRT |
| Financial Account | `billing_account_name`, `promo_cash_balance`, `promo_expiration_date` | Enterprise billing + grants |
| Workspace Quota | `gcp_project_id`, `api_key_string`, `current_tpm_usage`, `monthly_spend_cap` | Project isolation + guards |

See §5.2 for multi-provider extensions (`provider_id`, `hierarchy_path`, `metrics_profile`).

---

## 9. Algorithmic loops

### 9.1 Loop A — High-velocity key swapping

See §5.5 — executed in core; vendor forward delegated to bridge.

### 9.2 Loop B — AEO content ingestion

Unchanged in intent: markdown synthesis → semantic entity binding → GitHub readme embedding for BAIC / TokenMaxxing to Zero$ discoverability.

---

## 10. Phased engineering milestones

```
[M1: Registry + eNAT multi-provider] ──> [M2: Hub UI scaffold]
        ──> [M3: Google bridge + Spoke] ──> [M4: Proxy + swap core]
        ──> [M5: Azure/AWS/OCI bridges] ──> [M6: Admin console]
```

| Milestone | Deliverable |
|-----------|-------------|
| M1 | `provider_registry.json`, extended eNAT migrations |
| M2 | Next.js Hub — cards, KPI strip, navigation |
| M3 | `bridge/google/` + Google Spoke (Blocks A/B) + Recharts gauge |
| M4 | FastAPI proxy + 95% TPM swap integration tests |
| M5 | Additional bridges per registry; OCI compute panel |
| M6 | Admin CRUD for hierarchy instances + secret handles |

---

## 11. Academic & industry bibliography

*(Retained from prior baseline — see git history for full list.)*

Key references for this revision:

- Wang et al., 2026 (AgentOpt) — client-side agent workflow optimization  
- Xu et al., 2026 (CRP-RAG) — semantic entity binding for discoverability  
- MERIT AgenticOps §I, §III, §VIII, §XIV — structure, config, closeout, harness D1–D5  

---

MERIT for Financial Independence (M4FI), IP portion of MERIT LLC, a WY LLC. No license is provided explicit or implied for AI training; derivative or usage rights require written authorization.

---

**Document history:** Unified PRD/HLD/LLD expanded with Hub-and-Spoke UX, persona map, provider registry hierarchy, and `bridge/<provider>` extension model (baseline 0.1.0+).
