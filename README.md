# README

## Welcome to the TokenMaxxing2Zero Tracker (T2Z)!

This project is part of the **Bay Area Inference Club (BAIC)** initiative, focused on optimizing token usage and minimizing operational costs for AI-driven workflows.

## Getting Started

Full setup and git workflow: **[Bootstrapping Guide](docs/BOOTSTRAPPING.md)**

### Operator scripts (run from repo root)

| Script | When to use |
|--------|-------------|
| [`merit_bootstrap.ps1`](scripts/merit_bootstrap.ps1) | First-time Git + GitHub setup; `-Status` to verify |
| [`mXout.ps1`](scripts/mXout.ps1) | Lock a file or directory (recursive) and pull from remote |
| [`mXin.ps1`](scripts/mXin.ps1) | Commit, push, and release locks after editing |

```powershell
.\scripts\merit_bootstrap.ps1              # once: bootstrap
.\scripts\mXout.ps1 -Path docs\BAIC_theme.md  # lock + pull
# ... edit ...
.\scripts\mXin.ps1                           # push + unlock
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
├── scripts/                # Operator automation
│   ├── merit_bootstrap.ps1 # First-time repo bootstrap
│   ├── mXout.ps1           # Check-out: lock + pull
│   └── mXin.ps1            # Check-in: commit + push + unlock
├── tests/
├── ops/
│   └── locks/              # mXout lock registry (tracked in git)
├── cfg/                    # Single source of truth
│   └── theme.md
├── docs/
│   ├── BOOTSTRAPPING.md
│   ├── input/BAIC_PRD.md
│   └── BAIC_theme.md
└── output/
```
