# MERIT layered env — BAIC consumer requirements (IAR)

**Requester:** BAIC (`BAI`) — **consumer**  
**Implementer:** HumanBala platform (L1) — **`HumanBala/lib/merit_env.py`** + **`HumanBala/scripts/Import-MeritEnv.ps1`**  
**Policy:** MERIT L1 §II.G cfg vs secrets · L3 `*.instructions` chain · vault `deploy-env.ps1`  
**Not in scope:** meritutils **`merit_workbench`** — see [MERITUTILS_WORKBENCH.md](MERITUTILS_WORKBENCH.md)

**IDs:** Platform rows **BAI-PLT-ENV-01…** · BAIC integration **BAI-ENV-V01…**

---

## EXECUTIVE ACTION NEEDED

**HumanBala / MERIT platform:** Layered env loader is **implemented** in `HumanBala/lib/merit_env.py`. BAIC consumes via `core/merit_env.py` wrapper. No meritutils package required for env.

**BAIC agent:** Use `load_merged_provider_secrets()` at startup; document operator workflow in `baic_usage.md`. Register BAIC in vault `merit-projects.json` when vault deploy path is needed.

---

## 1. Design principle — hybrid layered merge

Mirror the **`*.instructions`** chain (L1 → L2 persona → L3 repo). **Do not** copy secrets into each repo manually when vault deploy is available.

| Tier | Analog | Path | Contents |
|------|--------|------|----------|
| **L1 (vault)** | MERIT.instructions | `merit-private-vault/env/personas/<Persona>/.env.local` | Shared identity: `GIT_USER_EMAIL`, `GITHUB_TOKEN`, `MERIT_PERSONA` |
| **L2 (persona runtime)** | AgentDraven.instructions | `%USERPROFILE%\HumanBala\env\<Persona>\.env.local` | Deployed copy of L1 (`deploy-env.ps1`) |
| **L3 (repo)** | BAIC.instructions | `<repo>/.env.local` | Project secrets: cloud keys, **GROQ/OPENAI/GEMINI/ANTHROPIC**, `MERIT_PERSONA` pointer |

**Precedence (low → high):** L2 persona → **L3 repo wins** on duplicate keys.

**Guard:** Persona layer loads only when repo `.env.local` exists (keeps pytest sandboxes isolated).

---

## 2. Common API (all MERIT repos)

### Python

```python
# HumanBala/lib/merit_env.py (SSOT)
from merit_env import load_merged_env, apply_merged_env

env = load_merged_env(repo_path=Path("/path/to/BAIC"))
apply_merged_env(repo_path=Path.cwd())  # sets os.environ; repo wins
```

```python
# BAIC wrapper — core/merit_env.py
from core.merit_env import load_merged_env, secrets_from_merged_env
# Startup: core/config_loader.load_merged_provider_secrets()
```

### PowerShell

```powershell
. $HOME\HumanBala\scripts\Import-MeritEnv.ps1 -RepoPath (Get-Location)
```

### Vault deploy (optional)

```powershell
# merit-private-vault/scripts/deploy-env.ps1 -Project baic
# Merges vault persona + vault env/baic/.env.local → AgentDraven/BAIC/.env.local
```

---

## 3. BAIC secret mapping

| Env var | Provider | Notes |
|---------|----------|-------|
| `GROQ_API_KEY` | `groq` | Direct LLM API |
| `OPENAI_API_KEY` | `openai` | Direct LLM API |
| `GEMINI_API_KEY` | `gemini` | Direct LLM API |
| `ANTHROPIC_API_KEY` | `anthropic` | Direct LLM API |
| `GOOGLE_APPLICATION_CREDENTIALS` | `google_cloud` | Hyperscaler |
| `AZURE_OPENAI_*` | `microsoft_azure` | Hyperscaler |
| `AWS_*` | `amazon_aws` | Hyperscaler |
| `OCI_*` | `oracle_oci` | Hyperscaler |
| `MERIT_PERSONA` | — | Selects L2 persona file |

SSOT shapes: `cfg/secrets.example.json` · `.env.local.example` · `core/bridge_secrets.py`

**Routing SSOT (models/endpoints):** sibling `dirt/cfg/llm_providers.json` — secrets only in env, never in bridge source (MERIT §II.G).

---

## 4. Platform acceptance (HumanBala — already shipped)

| ID | Criterion | Evidence |
|----|-----------|----------|
| **BAI-PLT-ENV-01** | Python `load_merged_env` L2→L3 merge | `HumanBala/lib/merit_env.py` |
| **BAI-PLT-ENV-02** | PowerShell `Import-MeritEnv.ps1` | `HumanBala/scripts/Import-MeritEnv.ps1` |
| **BAI-PLT-ENV-03** | Persona skip when no repo `.env.local` | `core/merit_env.py` + unit behavior |
| **BAI-PLT-ENV-04** | Maps env → `cfg/secrets.json` shape | `core/config_loader.load_merged_provider_secrets()` |

---

## 5. BAIC consumer validation

| ID | Probe | Pass |
|----|-------|------|
| **BAI-ENV-V01** | `python run_baic.py --validate-config` with `.env.local` keys | **PASS** (v0.1.9) |
| **BAI-ENV-V02** | Live startup loads merged secrets (no stub) | pending operator `.env.local` |
| **BAI-ENV-V03** | `Import-MeritEnv.ps1` sets same keys as Python loader | pending manual |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-08 | Initial IAR — layered env requirements for BAIC |
