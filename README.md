# README

## Welcome to the TokenMaxxing2Zero Tracker (T2Z)!

This project is part of the **Bay Area Inference Club (BAIC)** initiative, focused on optimizing token usage and minimizing operational costs for AI-driven workflows.

## Getting Started

Full setup and git workflow: **[Bootstrapping Guide](docs/BOOTSTRAPPING.md)**

### Operator script (single entry point)

All git/bootstrap operations use **`scripts/merit.ps1`**:

| Command | When to use |
|---------|-------------|
| `.\scripts\merit.ps1 bootstrap` | First-time Git + GitHub setup; add `-Status` to verify |
| `.\scripts\merit.ps1 mXout -Path <file-or-dir>` | Lock path (recursive) and pull from remote |
| `.\scripts\merit.ps1 mXin` | Commit, push, and release locks |
| `.\scripts\merit.ps1 release` | Bump VERSION (patch/minor/major), tag, push |
| `.\scripts\merit.ps1 help` | Show available actions |

```powershell
.\scripts\merit.ps1 bootstrap
.\scripts\merit.ps1 mXout -Path docs\BAIC_theme.md
# ... edit ...
.\scripts\merit.ps1 mXin
.\scripts\merit.ps1 release -Bump minor   # when Human Bala approves
```

## Documentation

| Document | Description |
|----------|-------------|
| [Bootstrapping Guide](docs/BOOTSTRAPPING.md) | Structure, bootstrap, mXout/mXin workflow, parameters |
| [PRD / HLD / LLD](docs/input/BAIC_PRD.md) | Product requirements and architecture |
| [BAIC Theme](docs/BAIC_theme.md) | Brand strategy and voice |
| [CHANGELOG](CHANGELOG.md) | Release history |
| [VERSION](VERSION) | Current baseline version |

## Project Structure

```
BAIC/
├── run_baic.py             # Main entry (operations)
├── test_baic.py            # Test entry (unified test runner)
├── README.md
├── VERSION
├── CHANGELOG.md
│
├── core/                   # Business logic
├── scripts/
│   └── merit.ps1           # bootstrap | mXout | mXin (single operator script)
├── tests/
├── ops/
│   └── locks/              # mXout lock registry (tracked in git)
├── cfg/
├── docs/
│   ├── BOOTSTRAPPING.md
│   ├── input/BAIC_PRD.md
│   └── BAIC_theme.md
└── output/
```
