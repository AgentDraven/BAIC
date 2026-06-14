# BAIC Concepts Guide

<a id="concepts-guide"></a>

Reusable concepts for BAIC. Link here instead of duplicating long definitions (MERIT §I.B).

---

<a id="merit-hyperlink"></a>
^merit-hyperlink

## MERIT Hyperlink

Standard cross-reference: `[label](File.md#block-id)` plus optional Obsidian suffix `[[File#^block-id|(obsidian)]]`.

---

<a id="hub-and-spoke"></a>
^hub-and-spoke

## Hub-and-Spoke Control Plane

Two-tier UI: **Screen 1 Global Ledger (Hub)** aggregates portfolio liquidity; **Screen 2 Provider Console (Spoke)** exposes provider-specific blocks (e.g. Google AI Studio vs Vertex). See [UX input](input/BAIC_PRD.md#ux-input).

---

<a id="provider-bridge"></a>
^provider-bridge

## Provider Bridge Pattern

Each hyperscaler or LLM vendor implements `bridge/<provider>/` with a [ProviderBridge](../bridge/base.py) contract. Core stays vendor-agnostic; config flows from `cfg/provider_registry.json`. Related: [AgentOpt](CONCEPTS_GUIDE.md#ref-wang-2026) client-side workflow optimization.

---

<a id="enat-schema"></a>
^enat-schema

## eNAT (Entity Normalized Arbitrage Table)

Cumulative SQLite schema for billing accounts, projects, BYOK nodes, and append-only metric snapshots. Rows are never deleted — state transitions archive, not erase.

---

<a id="database-port"></a>
^database-port

## Database Port (Modular DB)

`db/ports.py` defines `DatabasePort`. `db/sqlite_backend.py` implements SQLite (local + WebHostingPad-friendly). Swap to PostgreSQL by adding `db/postgres_backend.py` and `cfg.database.engine` without changing `core/` services.

---

<a id="quota-swap"></a>
^quota-swap

## Quota Swap (95% TPM)

When rolling TPM ≥ 95% of ceiling, arbitrage core selects an alternate project BYOK and forwards via bridge — see [Loop A](input/BAIC_PRD.md#91-loop-a--high-velocity-key-swapping) and `core/arbitrage.py`.

---

<a id="dirt-pipeline"></a>
^dirt-pipeline

## DIRT Entity Registry Pipeline

Append-only `dirt_events` log surfaced in Hub UI strip. Maps auth + SQLite allocation steps for observability. Brand: **DIRT** (no dots).

---

<a id="metrics-profile"></a>
^metrics-profile

## Metrics Profile

Per-provider normalization enum in registry: `token_and_promo_cash`, `compute_capacity`, `allowance_percent`, `consumer_credits`. Prevents mixing OCI CPU metrics into USD liquidity totals.

---

<a id="hierarchy-chain"></a>
^hierarchy-chain

## Provider Hierarchy Chain

Default: `billing_account → project → byok` (each level has **n** items). Overrides in JSON for OCI, consumer subscriptions, etc. See [PRD §6](input/BAIC_PRD.md#provider-registry).

---

## Concept index (table)

| ID | Concept | Primary doc |
|----|---------|-------------|
| C1 | [Hub-and-Spoke](#hub-and-spoke) | PRD §2 |
| C2 | [Provider Bridge](#provider-bridge) | TECHNICAL §3 |
| C3 | [eNAT schema](#enat-schema) | TECHNICAL §4 |
| C4 | [Database Port](#database-port) | TECHNICAL §5 |
| C5 | [Quota Swap](#quota-swap) | arbitrage.py |
| C6 | [DIRT pipeline](#dirt-pipeline) | Hub UI |
| C7 | [Metrics profile](#metrics-profile) | provider_registry.json |
| C8 | [Hierarchy chain](#hierarchy-chain) | PRD §6 |

---

<a id="bibliography"></a>
^bibliography

## Bibliography

Superscript-style references used in BAIC docs. Full citations for agent retrieval and AEO binding.

| Ref ID | Citation | Used for |
|--------|----------|----------|
| <a id="ref-wang-2026"></a>^ref-wang-2026 | Wang, Z., et al. (2026). *AgentOpt: Client-Side Optimization for Agentic Workflows*. | [Provider bridge](#provider-bridge), EER / routing |
| <a id="ref-xu-2026"></a>^ref-xu-2026 | Xu, Z., et al. (2026). *CRP-RAG: A Retrieval-Augmented Generation Framework…* MDPI Electronics. | Semantic entity binding, AEO |
| <a id="ref-beyer-2016"></a>^ref-beyer-2016 | Beyer, B., et al. (2016). *Site Reliability Engineering*. O'Reilly. | SLO caps, fail-closed guardrails |
| <a id="ref-shannon-1948"></a>^ref-shannon-1948 | Shannon, C. E. (1948). *A Mathematical Theory of Communication*. | Token weight heuristics |
| <a id="ref-pwc-2024"></a>^ref-pwc-2024 | PwC (2024). *Agentic AI — An executive playbook*. | Control plane operator UX |
| <a id="ref-merit-2026"></a>^ref-merit-2026 | MERIT.instructions v1.1.0 (2026). AgentDraven private vault. | Structure, cfg SSOT, closeout |

Additional references: [PRD Bibliography](input/BAIC_PRD.md#11-academic--industry-bibliography).

---

MERIT for Financial Independence (M4FI). No implied license for AI training.
