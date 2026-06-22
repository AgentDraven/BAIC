# BAIC Documentation Index

MERIT **3-doc product SSOT** (wave 6):

<!-- merit:cert-visibility:start -->
## MERIT certification (vault SSOT)

| Field | Value |
|-------|-------|
| **Project** | baic |
| **Certified** | no |
| **Level** | none |
| **Issued** | 2026-06-13 04:46:25 |
| **Roles** | — |

**Interlocks:** none registered.

Registry SSOT: `merit-private-vault/cfg/certification-registry.json` · interlocks: `cfg/interlock-registry.json` · program: `cfg/merit-certification-program.json`

Refresh: `python scripts/meritcert.py refresh-index` (from this repo) · operator steps: vault `docs/vault_usage.md` §3
<!-- merit:cert-visibility:end -->

| Doc | Role |
|-----|------|
| [baic_design.md](baic_design.md) | Architecture, HLD/LLD |
| [baic_usage.md](baic_usage.md) | Operator & user guide |

### IAR (cross-repo handoffs — MERIT §0.D)

| Doc | Provider | Status |
|-----|----------|--------|
| [IAR/MERITUTILS_WORKBENCH.md](IAR/MERITUTILS_WORKBENCH.md) | meritutils — **`merit_workbench@0.3.2` PAR** | **PAR shell wired**; stringent audit **PENDING** |
| [IAR/MERITUTILS_ENV.md](IAR/MERITUTILS_ENV.md) | HumanBala layered env | **ACCEPT** (platform shipped) |

Legacy: `.archive/docs/` · deep input: [input/](input/)

## AgentDraven SOTU

- [IAR/SOTU.md](IAR/SOTU.md) — executive MERIT role, provider/consumer state, and next closeout action.

<!-- merit:repo-hygiene:start -->
## Repo hygiene

| Field | Value |
|-------|-------|
| **Status** | `clean` |
| **Updated** | 2026-06-14 08:48 UTC |
| **Git-tracked** | `.md` 14 · `.json` 9 · `.py` 56 |
| **Sprawl** | `pass` · profile `phase_product` |
| **Hyperlinks** | Found 0 issue(s) in BAIC docs/: |
| **Root floaters** | 0 |
| **Zero-byte files** | 0 |
| **Version mismatches** | 0 |

### Sprawl groups

| Group | Count | Cap | Status |
|-------|------:|----:|--------|
| product-docs | 3 | 3 | pass |
| cfg-json | 6 | 6 | pass |

Refresh: `python scripts/meritcert.py refresh-index` · validate: `python scripts/compliance/validate_json_sprawl.py --repo . --project baic`
<!-- merit:repo-hygiene:end -->
