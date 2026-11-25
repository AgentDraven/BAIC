<a id="contents"></a>
# baic_usage.md ^contents

Wave 6 3-doc SSOT. Architecture: [baic_design.md](baic_design.md).

---

# BAIC User Guide

Operator guide for the TokenMaxxing Control Plane.

---

## Quick start

```powershell
python -m pip install -r requirements.txt
cd web; npm install; npm run build; cd ..
python run_baic.py
```

Browser opens **http://127.0.0.1:8765/** (API + UI on one port).

Stub demo (no secrets):

```powershell
python run_baic.py --stub
```

---

## Secrets and layered env (L2 → L3)

BAIC follows the MERIT **`*.instructions`** chain for secrets — same pattern as other AgentDraven repos.

| Tier | File | Role |
|------|------|------|
| **L2 persona** | `%USERPROFILE%\HumanBala\env\AgentDraven\.env.local` | Shared operator identity (`GITHUB_TOKEN`, `GIT_USER_EMAIL`) |
| **L3 repo** | `BAIC/.env.local` | Project keys — **wins** on duplicates |

**Setup:**

1. Copy `.env.local.example` → `.env.local`
2. Set `MERIT_PERSONA=AgentDraven`
3. Fill provider keys (see table below)

**Load env (PowerShell session):**

```powershell
. $HOME\HumanBala\scripts\Import-MeritEnv.ps1 -RepoPath (Get-Location)
```

**Validate scaffold:**

```powershell
python run_baic.py --validate-config
```

Vault deploy (optional): `merit-private-vault/scripts/deploy-env.ps1 -Project baic` merges vault persona + project env into L3.

Detail: [IAR/MERITUTILS_ENV.md](IAR/MERITUTILS_ENV.md)

### Provider keys in `.env.local`

| Env var | Provider kind |
|---------|---------------|
| `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT` | hyperscaler (Google) |
| `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY` | hyperscaler (Azure) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | hyperscaler (AWS) |
| `OCI_*` | hyperscaler (OCI) |
| `GROQ_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` | **llm_api** (direct APIs) |
| `CURSOR_API_TOKEN`, `GITHUB_TOKEN`, `GOOGLE_ONE_CLIENT_ID` | consumer_frontend |

Model routing SSOT for dirt sibling: `dirt/cfg/llm_providers.json` (endpoints/models); secrets stay in env only.

---

## UI tour

### Global Ledger (Hub)

| Section | Action |
|---------|--------|
| Consumer card | Click CTA (e.g. Troubleshoot Sync) |
| Infra / llm_api card | **Enter console** → Spoke |
| DIRT strip | Read-only system events |
| Config rail (left) | Registry summary; future admin HND |
| X-Ray (right) | Diagnostics stream (MERIT §II.H) |

### Provider Spokes

- **Hyperscaler** — promo pools, TPM, cost gauge, capability matrix blocks
- **Consumer** — subscription allowance, routing CTAs
- **LLM API** (`groq`, `openai`, `gemini`, `anthropic`) — BYOK block + model list + `api_base` header

**Back to Hub** link top-left.

---

## Personas

| Role | You need |
|------|----------|
| **User** | This guide + `run_baic.py` |
| **Admin** | provider_registry.json + [PRD §6](input/BAIC_PRD.md#provider-registry) [[input/BAIC_PRD#^provider-registry]] |
| **Developer** | [bridge/README.md](../bridge/README.md) + [baic_design.md](baic_design.md) |

---

## Admin: add a provider (no code)

1. Copy fields from provider_registry.example.json
2. Set `kind`: `hyperscaler` | `consumer_frontend` | `llm_api`
3. Set `hierarchy[]` — `llm_api` uses `["byok"]` only
4. Point `bridge_module` at `bridge.<name>`
5. Add secrets to `.env.local.example` + `cfg/secrets.example.json`
6. Restart `run_baic.py`
7. Closeout with `merit.ps1 mXin`

---

## merit_workbench (PAR CDN)

BAIC declares its meritutils consumer lane in `cfg/meritutils_consumer.json`. Missing promo codes resolve to `FREEASINTRO`, and BAIC reports affiliate code `BAIC`. Registry promotion remains separate from this local usage baseline.

Admin grid+inspector surfaces use **`merit_workbench`** from meritutils **PAR CDN** — not a local fork or npm vendoring.

| Item | Value |
|------|-------|
| **Pin** | `meritutils/merit_workbench@0.3.2` |
| **Load** | `web/index.html` → `pkg-meritutils.vercel.app` |
| **SSOT** | `cfg/merit_par_pins.json` · [IAR/MERITUTILS_WORKBENCH.md](IAR/MERITUTILS_WORKBENCH.md) §0 |

**Status:** PAR shell **wired**; tenant adapters **PENDING** — see **BAI-MWB-V01…06**.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank UI | Run `cd web && npm run build` |
| API error on Hub | Delete `output/baic_state.db` and restart (re-seeds demo) |
| Port in use | Change `cfg/config.json` → `api_port` |
| Live mode fails | Check `.env.local`; run `--validate-config` |

---

MERIT closeout: `.\scripts\merit.ps1 mXin` after doc or cfg changes.
