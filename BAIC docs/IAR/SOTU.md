# BAIC SOTU - 2026-09-21

## Executive status

**Current status: GitHub-closed, locally validated, not cloud-production verified.**

BAIC is the active `AgentDraven/BAIC` control-plane repository. The local checkout is clean at
`v0.8.23`, `HEAD` matches `origin/main`, configuration validation passes, and the unified suite
passes **42/42** tests. This proves the local application baseline only; it does not prove a Vercel
project exists, that the current operator is authorized for the intended Vercel scope, or that a
hosted production runtime is serving BAIC.

The checkout has no `.vercel/project.json` or `.vercel/repo.json`, and no BAIC production URL is
recorded in the repo. The current connected Vercel identity could not access the
`meritecosystemv01` scope, so the Vercel account/project owner remains **unverified**.

## MERIT role alignment

| Field | State |
|---|---|
| Registry role | Unconnected |
| Certification | Foundation pass |
| Active top-level docs | `INDEX.md`, `baic_design.md`, `baic_usage.md` |
| Provider edges | None |
| Consumer edges | None in current registry |
| GitHub source | `https://github.com/AgentDraven/BAIC` · `v0.8.23` · `origin/main` aligned |
| Local validation | `python run_baic.py --validate-config` PASS · `python test_baic.py` 42/42 PASS |
| Vercel link | Not present in checkout |
| Hosted production | **UNVERIFIED** — no BAIC deployment, alias, or hosted smoke evidence |

## SOTU

BAIC remains a control-plane/product repo. Prior meritutils workbench discussion is documented locally, but the vault registry does not currently promote BAIC as a requester edge. BAIC should not claim provider acceptance unless the provider repo or a registry-backed requester IAR records it.

## Cloud-production readiness gate — 2026-09-21

BAIC is not yet cloud-production ready. The remaining work is:

1. **Confirm ownership and scope:** identify the intended Vercel account/team and BAIC project name; obtain operator authorization for that scope.
2. **Add deployment binding:** create or verify the scoped `cfg/flask_deploy.json` entry and establish the repo’s `.vercel/project.json` link using the MERIT deployment workflow. Do not use an unscoped `vercel --prod` upload.
3. **Define the production runtime:** confirm the FastAPI entry point, static React build output, Python/runtime settings, writable-database limitation, and whether BAIC is appropriate for Vercel’s serverless model or needs another host.
4. **Provision only required production environment variables:** sync from the vault through the approved environment workflow; keep credentials vault-only and document names/purpose, never values, in this IAR.
5. **Deploy and capture evidence:** record deployment ID, canonical alias, source commit/tag, build result, and timestamp.
6. **Run hosted smoke/E2E checks:** verify public health, protected admin routes, representative hub/spoke API calls, static asset loading, and absence of demo/stub data in production.
7. **Obtain requester acceptance:** update this IAR and the vault registry only after the hosted evidence passes; local green tests alone are insufficient.

Until those items are complete, the correct label is **foundation-pass / GitHub-closed / local-valid / hosted-production-pending**, not production-ready.

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
