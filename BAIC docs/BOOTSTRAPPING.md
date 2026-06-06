# BOOTSTRAPPING.md

MERIT repository lifecycle: **structure first**, **bootstrap second**, **mXout / mXin** for collaborative edit and sync.

All operator commands run through **one script**: `scripts/merit.ps1`.

## Quick reference

| Step | Command | Purpose |
|------|---------|---------|
| 0 | (manual or `-ScaffoldMissing`) | MERIT folder layout |
| 1 | `merit.ps1 bootstrap` | First-time Git + GitHub setup |
| 2 | `merit.ps1 mXout` | Lock file/dir (recursive) + pull from remote |
| 3 | *(edit locally)* | Exclusive work on locked paths |
| 4 | `merit.ps1 mXin` | Commit + push + release locks |
| * | `merit.ps1 bootstrap -Status` | Health check anytime |

```powershell
.\scripts\merit.ps1 help          # list actions
.\scripts\merit.ps1 bootstrap     # first-time setup
.\scripts\merit.ps1 mXout -Path "BAIC docs\BAIC_theme.md"
.\scripts\merit.ps1 mXin
```

---

## 0. Before You Run Bootstrap

`merit.ps1 bootstrap` assumes the **MERIT golden-standard layout** (section I.A) exists at the repo root.

| Expectation | Required? | Notes |
|-------------|-----------|-------|
| `core/`, `scripts/`, `tests/`, `cfg/`, **`BAIC docs/`** (`{Name} docs/`), `output/` | **Yes** | Directory skeleton |
| `README.md`, `VERSION`, `CHANGELOG.md` | Recommended | `-ScaffoldMissing` can create placeholders |
| `AGENTS.md`, `.env.example` | Recommended | L1/L2 pointer and secrets template |
| `run_[project].py`, `test_[project].py` | Recommended | Two-entry-point pattern |
| `ops/` | Optional | Holds `ops/locks/` for mXout file locks |
| `.env.local`, `.git/`, GitHub remote | **No** | Created by bootstrap |

```powershell
.\scripts\merit.ps1 bootstrap -ScaffoldMissing
```

**Machine prerequisites:** Git, GitHub CLI (`gh`), network.

---

## 1. Bootstrap — `merit.ps1 bootstrap`

```powershell
.\scripts\merit.ps1 bootstrap              # first run
.\scripts\merit.ps1 bootstrap -Status      # verify only
.\scripts\merit.ps1 bootstrap -Sync        # quick stage-all sync
```

---

## 2. Collaborative Edit — `merit.ps1 mXout` and `merit.ps1 mXin`

### mXout — check-out (lock + pull)

```powershell
.\scripts\merit.ps1 mXout -Path "BAIC docs\BAIC_theme.md"
.\scripts\merit.ps1 mXout -Path "BAIC docs"
.\scripts\merit.ps1 mXout -List
```

**Parameters:** `-Path` / `-Target`, `-RepoPath`, `-Branch`, `-List`, `-NonInteractive`, `-Force`

### mXin — check-in (commit + tag + push + unlock)

Per MERIT §VIII.F, mXin **creates an annotated `vX.Y.Z` tag from `VERSION`**, pushes the branch, and pushes the tag (default **ya**). Use **`-SkipTag`** to opt out.

```powershell
.\scripts\merit.ps1 mXin
.\scripts\merit.ps1 mXin -Path "BAIC docs\BAIC_theme.md"
.\scripts\merit.ps1 mXin -All
.\scripts\merit.ps1 mXin -Message 'feat: your free text + quotes -- OK'
.\scripts\merit.ps1 mXin -SkipTag
.\scripts\merit.ps1 mXin -MultilineMessage
.\scripts\merit.ps1 mXin -List
```

Commit messages support free text (quotes, `+`, `--`); you will be prompted with `>` if `-Message` is omitted.

---

## 3. Baseline Release — `merit.ps1 release`

Manual VERSION bump, CHANGELOG entry, annotated tag, and push (MERIT section VIII.A).

```powershell
.\scripts\merit.ps1 release                  # interactive: pick patch / minor / major
.\scripts\merit.ps1 release -Bump patch
.\scripts\merit.ps1 release -Bump minor -Message "Milestone: first operator entry points"
.\scripts\merit.ps1 release -Bump major -Message "Breaking: new architecture"
```

| Bump | Result | Who may run (MERIT) |
|------|--------|---------------------|
| **patch** | `0.0.14` → `0.0.15` | Routine closeout / validated work |
| **minor** | `0.0.x` → `0.1.0` | **Human Bala only** — script asks for confirmation |
| **major** | `0.x.y` → `1.0.0` | **Human Bala only** — script asks for confirmation |

**Parameters:** `-Bump patch|minor|major`, `-Message` (changelog bullets), `-Branch`, `-NonInteractive`

---

## 4. Confirmation Codes (section II.F)

| Answer | Meaning |
|--------|---------|
| **ya** | Yes — this item only |
| **na** | No — skip this item |
| **ay** | All Yes — this item and all remaining |
| **an** | All No — skip this and all remaining |

---

## 5. Typical Workflow

```
1. Create MERIT folder structure (use BAIC docs/ not bare docs/)
2. .\scripts\merit.ps1 bootstrap
3. .\scripts\merit.ps1 mXout -Path "BAIC docs\somefile.md"
4. [edit locally]
5. Phase closeout hygiene (section 6)
6. .\scripts\merit.ps1 mXin
7. .\scripts\merit.ps1 bootstrap -Status
```

---

## 6. Phase closeout hygiene (lint before tests)

Before `mXin` or `release`, run static analysis **before** pytest (fast fail):

```powershell
python -m ruff check core bridge db tests run_baic.py test_baic.py
python -m compileall -q core bridge db tests run_baic.py test_baic.py
python test_baic.py
```

When the web UI changed, also:

```powershell
cd web
npm run lint
npx tsc --noEmit
npm test
npm run build
cd ..
```

Then update `VERSION` + `CHANGELOG.md` and run `.\scripts\merit.ps1 mXin`.

**Ruff** is the Python linter (style, imports, many bug classes). **compileall** confirms syntax. TypeScript phases use **tsc --noEmit**.

