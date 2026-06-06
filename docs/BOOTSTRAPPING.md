# BOOTSTRAPPING.md

MERIT repository lifecycle: **structure first**, **bootstrap second**, **mXout / mXin** for collaborative edit and sync.

## Quick reference

| Step | Script | Purpose |
|------|--------|---------|
| 0 | (manual or `-ScaffoldMissing`) | MERIT folder layout |
| 1 | `merit_bootstrap.ps1` | First-time Git + GitHub setup |
| 2 | `mXout.ps1` | Lock file/dir (recursive) + pull from remote |
| 3 | *(edit locally)* | Exclusive work on locked paths |
| 4 | `mXin.ps1` | Commit + push + release locks |
| * | `merit_bootstrap.ps1 -Status` | Health check anytime |

---

## 0. Before You Run Bootstrap

`merit_bootstrap.ps1` assumes the **MERIT golden-standard layout** (section I.A) exists at the repo root.

| Expectation | Required? | Notes |
|-------------|-----------|-------|
| `core/`, `scripts/`, `tests/`, `cfg/`, `docs/` (or `{Name} docs/`), `output/` | **Yes** | Directory skeleton |
| `README.md`, `VERSION`, `CHANGELOG.md` | Recommended | `-ScaffoldMissing` can create placeholders |
| `AGENTS.md`, `.env.example` | Recommended | L1/L2 pointer and secrets template |
| `run_[project].py`, `test_[project].py` | Recommended | Two-entry-point pattern |
| `ops/` | Optional | Holds `ops/locks/` for mXout file locks |
| Product docs (PRD, theme) | Recommended | Can be added before or after bootstrap |
| `.env.local`, `.git/`, GitHub remote | **No** | Created by bootstrap |

**Preflight:** Bootstrap shows a structure report on every run. Missing directories:

```powershell
.\scripts\merit_bootstrap.ps1 -ScaffoldMissing
```

**Machine prerequisites:** Git, GitHub CLI (`gh`), network. Bootstrap stores `GIT_USER_EMAIL` and `GITHUB_TOKEN` in `.env.local` (gitignored).

---

## 1. Initial Bootstrap — `merit_bootstrap.ps1`

Run from the repository root:

```powershell
.\scripts\merit_bootstrap.ps1
```

Defaults: repo name = current folder name, parent = parent of cwd. Press **Enter** to accept.

### Bootstrap steps (first run)

1. MERIT structure preflight
2. `.env.local`, `cfg/`, `.gitignore` (secures secrets)
3. Git `user.name` / `user.email`
4. Local `git init` (if needed)
5. `docs/BOOTSTRAPPING.md` (if missing)
6. Initial commit
7. GitHub remote via `gh repo create` (if missing)
8. `origin` URL
9. Push to `main` (only when ahead)

### Verify-only mode

```powershell
.\scripts\merit_bootstrap.ps1          # auto verify if already bootstrapped
.\scripts\merit_bootstrap.ps1 -Status
```

Healthy result: `Bootstrap complete. Nothing to do.`

Quick sync (stage all, generic message — prefer mXin for selective closeout):

```powershell
.\scripts\merit_bootstrap.ps1 -Sync
```

---

## 2. Collaborative Edit Flow — `mXout.ps1` and `mXin.ps1`

**mXout** reserves a file or directory (recursively) so others cannot lock the same paths until you **mXin**. Locks live in `ops/locks/*.lock.json` and are pushed to the remote so the team sees them.

### mXout — check-out (lock + pull)

```powershell
# Single file
.\scripts\mXout.ps1 -Path docs\BAIC_theme.md

# Entire directory (all tracked files recursively)
.\scripts\mXout.ps1 -Path docs

# Multiple paths
.\scripts\mXout.ps1 -Path docs, cfg\theme.md

# Interactive path prompt when -Path omitted
.\scripts\mXout.ps1

# List all active locks
.\scripts\mXout.ps1 -List
```

**Parameters:** `-Path` / `-Target`, `-RepoPath`, `-Branch` (default `main`), `-List`, `-NonInteractive`, `-Force` (override others' locks — use with care).

**What mXout does:**

1. Pulls latest from `origin/main` (confirms with ya/na)
2. Checks `ops/locks/` for conflicting locks from other operators
3. Creates lock records for every **git-tracked** file under the path (recursive for directories)
4. Commits and pushes lock reservation to remote
5. Pulls again so your working copy is current

If another operator already holds a lock on that path (or any overlapping file), mXout stops with an error.

### mXin — check-in (commit + push + unlock)

```powershell
# Check in changes under your active locks (default)
.\scripts\mXin.ps1

# Scoped to one path
.\scripts\mXin.ps1 -Path docs\BAIC_theme.md

# Full-repo closeout (no lock required)
.\scripts\mXin.ps1 -All

# With message and version tag
.\scripts\mXin.ps1 -Message "feat: update theme" -PushTag

# List your locks
.\scripts\mXin.ps1 -List
```

**Parameters:** `-Path` / `-Target`, `-RepoPath`, `-Message`, `-Branch`, `-PushTag`, `-All`, `-List`, `-NonInteractive`.

**What mXin does:**

1. Pulls latest (ya/na confirm)
2. Lists pending changes in lock scope (or all pending if `-All`)
3. Stages each file with **ya / na / ay / an** (section II.F)
4. Prompts for commit message (unless `-Message` supplied)
5. Removes your lock files and commits lock release
6. Pushes commits to `origin/main`
7. Optionally pushes `VERSION` tag with `-PushTag`

---

## 3. Confirmation Codes (section II.F)

| Answer | Meaning |
|--------|---------|
| **ya** | Yes — this item only |
| **na** | No — skip this item |
| **ay** | All Yes — this item and all remaining |
| **an** | All No — skip this and all remaining |

Empty input defaults to **ya** unless documented otherwise (e.g. nested-repo guard defaults to **na**).

---

## 4. Typical Workflow

```
1. Create MERIT folder structure (+ docs content)
2. .\scripts\merit_bootstrap.ps1              ← first-time git + GitHub
3. .\scripts\mXout.ps1 -Path docs\somefile.md ← lock + pull
4. [edit locally — others blocked on that path]
5. .\scripts\mXin.ps1                         ← commit, push, release lock
6. .\scripts\merit_bootstrap.ps1 -Status      ← verify anytime
```

---

## 5. Deprecated Aliases

| Old | Use instead |
|-----|-------------|
| `create_baseline_repo.ps1` | `merit_bootstrap.ps1` |
| `merit_xin_xout.ps1 -Xin` | `mXin.ps1` |
| `merit_xin_xout.ps1 -XOut` | `mXout.ps1` |
