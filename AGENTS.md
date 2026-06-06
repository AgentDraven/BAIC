# AGENTS.md — BAIC bootstrap for Cursor agents

## Instruction chain (read order)

1. `%USERPROFILE%\HumanBala\MERIT.instructions` (L1)
2. `%USERPROFILE%\HumanBala\AgentDraven.instructions` (L2)
3. `BAIC.instructions` at repo root when present (L3)
4. Product SSOT under **`BAIC docs/`** — start at [BAIC docs/INDEX.md](BAIC%20docs/INDEX.md)

**Private vault:** clone `github.com/AgentDraven/merit-private-vault` → `~/AgentDraven/merit-private-vault`

## Entry points

| Script | Purpose |
|--------|---------|
| `python run_baic.py` | Start API + built UI (port 8765) |
| `python test_baic.py` | Unified pytest harness |
| `.\scripts\merit.ps1 mXin` | MERIT check-in closeout |

## Key paths

| Path | Role |
|------|------|
| `cfg/config.json` | API host/port, database engine |
| `cfg/provider_registry.json` | Provider hierarchy SSOT |
| `core/` | Vendor-agnostic arbitrage + FastAPI |
| `bridge/<provider>/` | Per-vendor integration |
| `db/` | Modular database (`DatabasePort` → SQLite) |
| `web/` | React control plane UI |
| `BAIC docs/CONCEPTS_GUIDE.md` | Concepts + bibliography |
| `BAIC docs/TECHNICAL_HLD_LLD.md` | Architecture diagrams |

## Closeout (MERIT §VIII.F)

Run **static analysis before tests** (fast fail), then baseline and push:

```powershell
python -m ruff check core bridge db tests run_baic.py test_baic.py
python -m compileall -q core bridge db tests run_baic.py test_baic.py
python test_baic.py
# Web phases also: cd web; npm run lint; npx tsc --noEmit; npm test; npm run build
```

Then: update `VERSION` + `CHANGELOG.md` → `.\scripts\merit.ps1 mXin -Message '...'`
