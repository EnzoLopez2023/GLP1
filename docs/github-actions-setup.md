# Setting Up GitHub Actions CI/CD for Sudoku & ShopKeep

This guide walks through wiring up **auto-deploy on push** for the Sudoku and ShopKeep repos, using the same self-hosted runner pattern already working for GLP-1.

> Assumes the home server already has:
> - Docker Desktop running under user `enzol`
> - `C:\Source\Repo\Sudoku` and `C:\Source\Repo\ShopKeep` cloned from GitHub
> - The GLP-1 runner working (proves the host environment is good)

---

## Per-app quick reference

| App      | Host port | Local path                 | GitHub repo (adjust if yours differs)  |
| -------- | --------- | -------------------------- | -------------------------------------- |
| Sudoku   | `3005`    | `C:\Source\Repo\Sudoku`    | `EnzoLopez2023/Sudoku`                 |
| ShopKeep | `3003`    | `C:\Source\Repo\ShopKeep`  | `EnzoLopez2023/ShopKeep`               |

Repeat the whole guide **twice**, substituting the values above. Instructions below use Sudoku as the example.

---

## Step 1 — Make sure the repo is on GitHub

On the home server (or your dev box), from the repo folder:

```powershell
cd C:\Source\Repo\Sudoku
git remote -v
```

If there's no `origin`, create the repo on GitHub first (empty, no README), then:

```powershell
git init                     # skip if already a git repo
git branch -M master
git remote add origin https://github.com/EnzoLopez2023/Sudoku.git
git add -A
git commit -m "Initial commit"
git push -u origin master
```

Also make sure you have a sensible `.gitignore`:

```
node_modules/
dist/
.env
*.log
*.db
*.db-wal
*.db-shm
.DS_Store
Thumbs.db
.vscode/
.idea/
_archive/
```

---

## Step 2 — Register a self-hosted runner for this repo

Each repo needs its own runner registration (same machine can host multiple).

1. GitHub → repo → **Settings → Actions → Runners → New self-hosted runner → Windows → x64**.
2. GitHub shows ~4 PowerShell commands. Use a **new folder per runner** so they don't clobber each other:

   ```powershell
   # Sudoku
   mkdir C:\actions-runner\Sudoku
   cd    C:\actions-runner\Sudoku
   # (paste download + extract commands from GitHub)
   .\config.cmd --url https://github.com/EnzoLopez2023/Sudoku --token <TOKEN-FROM-GITHUB>
   ```

   - Runner name: default is fine (e.g. `ZOMBIE`).
   - Labels: accept defaults (`self-hosted`, `Windows`, `X64`).
   - Work folder: `_work` (default).

3. Install as a Windows service:

   ```powershell
   .\svc.cmd install
   .\svc.cmd start
   ```

4. GitHub → Settings → Actions → Runners should show **Idle** (green dot).

Repeat for ShopKeep in `C:\actions-runner\ShopKeep`.

---

## Step 3 — Make the service run as `enzol` (so Docker Desktop is reachable)

Docker Desktop only serves the user who's logged in (`enzol`). The runner installs as `Network Service` by default and **cannot see Docker**.

1. **Win+R → `services.msc`**.
2. Find **`actions.runner.EnzoLopez2023-Sudoku.ZOMBIE`** (name will contain the repo).
3. Right-click → **Properties → Log On** tab.
4. Select **This account**, enter:
   - Account: `.\enzol`
   - Password: your Windows password (twice)
5. OK. If prompted "granted Log on as a service right", click OK.
6. Right-click the service → **Restart**.

Repeat for the ShopKeep service.

---

## Step 4 — Fix the "dubious ownership" git error (once per machine)

Git will refuse to run on a folder owned by a different user unless explicitly trusted. We've already done this for GLP-1, but each repo needs its own entry. In an **elevated** PowerShell:

```powershell
git config --system --add safe.directory C:/Source/Repo/Sudoku
git config --system --add safe.directory C:/Source/Repo/ShopKeep
```

(Verify: `git config --system --get-all safe.directory`.)

Also give the runner's user full access to the repo folder (normally fine if `enzol` already owns it, but explicit is safer):

```powershell
icacls "C:\Source\Repo\Sudoku"   /grant "enzol:(OI)(CI)M" /T
icacls "C:\Source\Repo\ShopKeep" /grant "enzol:(OI)(CI)M" /T
```

---

## Step 5 — Add the workflow file to each repo

Create **`.github/workflows/deploy.yml`** at the repo root.

### `Sudoku/.github/workflows/deploy.yml`

```yaml
name: Build & Deploy Sudoku

on:
  push:
    branches: [master]
  workflow_dispatch:

concurrency:
  group: deploy-sudoku
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: self-hosted
    defaults:
      run:
        working-directory: C:\Source\Repo\Sudoku

    steps:
      - name: Sync repo
        shell: powershell
        run: |
          git fetch --all --prune
          git reset --hard origin/master

      - name: Build image
        shell: powershell
        run: docker compose build

      - name: Restart container
        shell: powershell
        run: docker compose up -d

      - name: Wait for server
        shell: powershell
        run: Start-Sleep -Seconds 4

      - name: Health check
        shell: powershell
        run: |
          $r = Invoke-RestMethod -Uri 'http://localhost:3005/api/health' -TimeoutSec 10
          if ($r.status -ne 'ok') { throw "Health check failed: $($r | ConvertTo-Json)" }
          Write-Host "OK - db: $($r.db)"
```

### `ShopKeep/.github/workflows/deploy.yml`

Same file, swap three values:

```yaml
name: Build & Deploy ShopKeep

on:
  push:
    branches: [master]
  workflow_dispatch:

concurrency:
  group: deploy-shopkeep
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: self-hosted
    defaults:
      run:
        working-directory: C:\Source\Repo\ShopKeep

    steps:
      - name: Sync repo
        shell: powershell
        run: |
          git fetch --all --prune
          git reset --hard origin/master

      - name: Build image
        shell: powershell
        run: docker compose build

      - name: Restart container
        shell: powershell
        run: docker compose up -d

      - name: Wait for server
        shell: powershell
        run: Start-Sleep -Seconds 4

      - name: Health check
        shell: powershell
        run: |
          $r = Invoke-RestMethod -Uri 'http://localhost:3003/api/health' -TimeoutSec 10
          if ($r.status -ne 'ok') { throw "Health check failed: $($r | ConvertTo-Json)" }
          Write-Host "OK - db: $($r.db)"
```

> If the app's `/api/health` endpoint returns a different shape (e.g. just `{ ok: true }`), tweak the `if` line to match.

---

## Step 6 — Commit & push

```powershell
cd C:\Source\Repo\Sudoku
git add .github/workflows/deploy.yml
git commit -m "ci: auto build and deploy on push to master"
git push
```

Repeat for ShopKeep.

---

## Step 7 — Verify

1. GitHub → repo → **Actions** tab. You should see the run triggered by your push.
2. Click the run → click the `deploy` job → watch each step.
3. On success: the site is rebuilt and live.

### Manual re-run

Any time you want to redeploy without a commit:
**Actions tab → pick the workflow → Run workflow → Run workflow**.

---

## Scaling tip: one runner, many repos

GitHub also supports **organization-level** runners that any repo can use (avoids registering a new runner per repo). For personal repos under a user account that's not available, so per-repo runners are the right move. Each registered runner is just a small background process — having three on one box is fine.

---

## Troubleshooting cheatsheet

| Symptom                                                         | Fix                                                                                                 |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pwsh: command not found`                                       | Use `shell: powershell` (built-in) instead of `shell: pwsh` (PowerShell 7).                         |
| `fatal: detected dubious ownership`                             | `git config --system --add safe.directory <path>` as admin.                                         |
| `docker: command not found` or `error during connect`           | Service isn't running as `enzol`. Redo **Step 3**. Confirm Docker Desktop is running.               |
| Workflow run never appears                                      | Runner is Offline, or Actions is disabled in repo Settings → Actions → General.                     |
| `Permission denied` on repo files                               | Run the `icacls ... /grant "enzol:(OI)(CI)M" /T` command from Step 4.                               |
| Health check fails but container is up                          | Bump `Start-Sleep` to 10s, or loop with retries.                                                    |
| Push rejected (non-fast-forward)                                | Local is behind remote: `git pull --rebase` then push.                                              |

---

## Status badge (optional)

Add to each repo's `README.md`:

```markdown
![deploy](https://github.com/EnzoLopez2023/Sudoku/actions/workflows/deploy.yml/badge.svg)
```
