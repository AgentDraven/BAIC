# BAIC SOTU - 2026-06-21

## Executive status

BAIC is registered as a MERIT foundation-pass repo with no active provider-consumer interlock in the vault registry.

## MERIT role alignment

| Field | State |
|---|---|
| Registry role | Unconnected |
| Certification | Foundation pass |
| Active top-level docs | `INDEX.md`, `baic_design.md`, `baic_usage.md` |
| Provider edges | None |
| Consumer edges | None in current registry |

## SOTU

BAIC remains a control-plane/product repo. Prior meritutils workbench discussion is documented locally, but the vault registry does not currently promote BAIC as a requester edge. BAIC should not claim provider acceptance unless the provider repo or a registry-backed requester IAR records it.

## 2026-07-11 MERIT utilities usage alignment

BAIC is now locally aligned as a non-M4FI consumer candidate of upgraded meritutils through `cfg/meritutils_consumer.json`.

| Package | Pin | Use |
|---|---:|---|
| `merit_workbench` | `meritutils/merit_workbench@0.4.0` | Admin/provider registry grid + inspector |
| `merit_usage_meter` | `meritutils/merit_usage_meter@0.1.1` | Usage/audit metering with default promo |

Default usage promo is `FREEASINTRO`; BAIC affiliate code is `BAIC`. This is a local consumer alignment baseline; registry promotion remains a separate vault/interlock decision.

### E2E TDD plan

| Persona | Path | Assertion |
|---|---|---|
| Business operator | BAIC admin console | workbench surface loads from PAR CDN and does not fork provider UI |
| Provider reviewer | BAIC MERIT docs | local IAR distinguishes planning from provider ACCEPT |
| Usage auditor | meritutils usage manifest | missing promo resolves to `FREEASINTRO`; affiliate remains `BAIC` |

## AgentDraven review notes

- Keep BAIC's live integration state separate from local planning docs.
- Future provider-consumer promotion requires explicit requester IAR evidence.
- This SOTU is the executive review anchor for BAIC's current MERIT posture.
