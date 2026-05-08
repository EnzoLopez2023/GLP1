# Tare — Project Context & Decision Log

This file captures the architectural decisions, major work, and conventions
for the Tare (GLP-1 Tracker) app. It exists so a future Claude Code session —
or you on a different machine — can pick up where we left off without
re-deriving everything from `git log`.

**Append new entries at the top of "Work history" as work happens.** Older
entries stay below.

---

## Stack at a glance

- **Frontend:** Vite + React 18, framer-motion 12.x, Tailwind CSS, Recharts,
  lucide-react, Inter + Inter Tight fonts
- **Backend:** Node 24, Express 5, better-sqlite3 v12 (prebuilts for Node 24),
  `jose` for AAD JWT validation
- **Auth:** Microsoft Entra ID (MSAL), single tenant
  `<your-aad-tenant-id>`, client
  `<your-aad-client-id>`
- **AI:** Optional Anthropic SDK (`ANTHROPIC_API_KEY`) for nutrition/glucose
  coaching and Knowledge Base Q&A
- **Deploy:** Docker on a single host; GitHub Actions auto-deploys on push to
  `master`. The runner uses Windows-built-in PowerShell, no `pwsh` dependency.

## Locked-in architecture decisions

These have been chosen deliberately and shouldn't be revisited without a
strong reason:

1. **One SQLite file per user** at `/data/users/{oid}.db`. The server
   resolves a per-user handle on every request from the validated `oid`
   claim. **Not** a shared DB with `userId` columns — that approach was
   considered and rejected as too invasive.
2. **Single-tenant AAD only.** Token middleware rejects any `tid` mismatch.
   Adding a second tenant requires explicit code change.
3. **Repo and URL paths stay `glp1`** for stability; only user-facing brand
   reads "Tare". Don't rename the repo or container.
4. **Push directly to `master`.** Auto-deploy is the workflow; feature
   branches/PRs are not part of the loop. Permission rules in
   `.claude/settings.local.json` (gitignored) allow this for Claude.
5. **Card chrome is warm ivory `#fffaf3`**, not `bg-white`. Establishes the
   "paper on warm cream" feel of the design language (Image 391/392).
6. **Cards/tiles never carry a hard border** — soft `shadow-tile` only.
7. **Onboarding wizard is mandatory on first login** — the dashboard cannot
   render until the 5 required profile fields exist. Skip applies only to
   the optional medication step (4).
8. **Backup/restore feature was audited and locked** before the per-user
   migration. All 11 tables exported, atomic restore via `db.transaction`.
   Per-user DBs make backup/restore inherently per-user.

---

## Work history (newest first)

### 2026-05-08 — Medical Records section (commit `bc210f8`)

**Problem.** User wanted a personal medical records section in the Analysis
hub backed by real lab data from 2021–2026 ambulatory summary PDFs. Data
needed to live in the existing per-user SQLite DB without touching existing
tables.

**What shipped.**
- `server.js`: 5 new tables added to `SCHEMA_SQL` — `medical_vitals`,
  `medical_lab_results`, `medical_diagnoses`, `medical_medications`,
  `medical_procedures`. API routes: `GET /api/medical/{vitals,labs,
  diagnoses,medications,procedures}` and `POST /api/medical/seed`.
- `src/pages/MedicalRecords.jsx` (new): three-tab page.
  - **Overview**: stat pills for latest HbA1c/glucose/weight/ALT, weight
    area chart over all visits (2021–2026), HbA1c trend with diabetes
    reference lines, lipid panel trend, liver enzyme trend.
  - **Labs**: panel filter chips (All/HbA1c/Glucose/Lipid/CBC/CMP/etc.),
    per-test expandable history rows, H/L color coding.
  - **History**: diagnoses, medications, procedures each as icon-tiled
    lists; vitals table showing every visit.
- Navigation: added `/medical` route, "Medical Records" layout label,
  "Medical Records" hub card in Settings Analysis section.
- `scripts/seed-medical-records.mjs` (gitignored): one-shot seed script
  with all extracted medical data; run via `node scripts/... <db-path>`.

**Data seeded (from ambulatory PDFs).**
- 7 vitals visits (2021-08-03 → 2024-10-04). Weights converted from grams.
- 28 lab entries across 6 dates:
  - HbA1c trajectory: 5.5% → 5.6% → 5.9% (prediabetic) → 10.2% (DM)
  - Elevated ALT across all periods (NAFLD pattern)
  - Triglycerides elevated 2021 (208, 152 mg/dL); HDL low 2023 (37)
  - Glucose elevated throughout (115–138 mg/dL until 2026 jump to 246)
- 5 diagnoses: Type 2 DM (2026-03-10), prediabetes (resolved), hyper-
  triglyceridemia, elevated ALT, low HDL
- 3 medications: Azithromycin (completed), Benzonatate (completed),
  Tirzepatide/Mounjaro (active)
- 3 procedures: COVID PCR test (Jul 2021), pilonidal cyst excision (Sep
  2021), colonoscopy (Oct 2024)

**Seeding approach.**
Tables created via `SCHEMA_SQL` on first `getUserDb()` call after deploy.
For the running container, tables were created manually then seeded via
`docker cp` + `docker exec node seed script` before the deploy landed.
Re-seeding is safe: vitals use `INSERT OR IGNORE` (unique visitDate),
labs wipe and re-insert, others use `INSERT OR IGNORE` by name.

---

### 2026-05-07 — Per-user data isolation + first-time onboarding (commit `ea94897`)

**Problem.** App was single-tenant: shared `/data/glp1.db`, profile/settings
as `id=1` singletons, every API call accepted without an `Authorization`
header. Anyone authenticated to the AAD tenant saw the same data. Needed
isolation between Enzo and his wife (and any future user).

**Approach.** One SQLite file per user, resolved on every request from the
validated AAD `oid`. No schema changes to per-row tables. Auto-migration of
the legacy DB to the primary user's per-user file via `PRIMARY_USER_OID`
env var. New 4-step onboarding wizard captures Name/Age/Height/Starting
Weight/Goal Weight (required) plus optional medication info.

**What shipped.**
- `server.js`: extracted `SCHEMA_SQL` constant + `applyMigrations()`. New
  `getUserDb(oid)` opens (or returns cached) `/data/users/{oid}.db`,
  validates oid against `/^[0-9a-f-]{36}$/i`, runs schema on first open.
  `requireAuth` middleware uses `jose` to verify ID tokens (issuer,
  audience, expiry, tid) with 60s clock tolerance. `withUserDb` attaches
  `req.db`. CORS tightened to allow only `Content-Type` + `Authorization`.
  Every route handler swapped to `req.db.prepare(...)`.
- `src/auth/msalInstance.js` (new): single `PublicClientApplication`
  shared by main.jsx and api/client.js. `msalReady` promise gates
  rendering until init completes.
- `src/api/client.js`: every request acquires an ID token via
  `acquireTokenSilent` (scopes `openid profile`) and attaches
  `Authorization: Bearer <idToken>`. Falls back to
  `acquireTokenRedirect` on `InteractionRequiredAuthError` or 401.
- `src/components/onboarding/OnboardingWizard.jsx` (new): Tare-themed
  full-screen 4-step wizard with framer-motion step transitions, step pip
  indicator, per-step validation. Required fields plus optional
  Skip-able medication step. Reuses Button/FormField/Input/Select.
- `src/App.jsx`: gate inserted between IntroAnimation and routed app.
  Fetches profile after intro, computes `isProfileComplete()`, renders
  wizard in place of Layout when incomplete; refetches on completion.
- `docker-compose.yml`: new env vars `USERS_DIR`, `LEGACY_DB_PATH`,
  `PRIMARY_USER_OID`, `AAD_TENANT_ID`, `AAD_CLIENT_ID`.

**Decisions made.**
- One file per user (rejected: shared DB + userId column — would require
  rewriting every query). Cleanest isolation, queries unchanged.
- Auto-migration via `PRIMARY_USER_OID` (rejected: manual `mv` step). Zero
  downtime, no manual intervention required after env var is set.
- Wizard captures 5 required + optional medication step (rejected: just 5
  required). Optional step lets the dashboard journey widget light up on
  day one.
- ID token (not access token) for auth — audience is our app, validates
  cleanly. `User.Read` scope kept in `loginRequest` for compatibility but
  unused server-side.
- Inline gate in App.jsx (rejected: dedicated `useProfileComplete` hook).
  Single use site, indirection adds nothing.
- Height collected as ft+in pair, stored as `heightIn`. Friendlier UX.
- `/api/health` stays public for Docker healthcheck.

**Verified.** First login as Enzo migrated `/data/glp1.db` → per-user file,
all data preserved, no wizard. Subsequent logins skip the wizard. Negative
tests: no token → 401; bogus token → 401. AAD `oid` for primary user:
`<your-oid>`.

**Plan file:** `~/.claude/plans/i-want-to-implement-hashed-comet.md` (local,
not in repo) has the original implementation plan with risks/edge cases.

---

### 2026-04-30 — Card chrome blends with wood palette (commit `2dab5f8` + a final card-blend commit)

**Problem.** Cards still rendered as harsh `bg-white` panels on the warm
cream page background, making each card feel like an island. Image 392
showed how the design system intended them to read — soft warm ivory paper
that almost blends into the page.

**What changed.**
- `Card.jsx` default `bg-white` → `bg-[#fffaf3]`, removed border, used
  warm `shadow-tile` for elevation.
- `FormField.jsx` Input/Select/Textarea: warm ivory bg, wood-tone borders,
  wood-tone placeholder/disabled colors.
- `Modal.jsx` panel + dividers: warm ivory + wood tones.
- Knowledge Base topic rows + chips, You hub navigation rows, BloodGlucose
  filter pills: ivory paper.
- Meds + Glucose history lists: stripped card chrome entirely. Now flat
  rows under a small `RECENT` / `READINGS · N` eyebrow with
  `divide-y divide-wood-200/40` between rows. Sage-green check circles
  for injections, semantic-colored value pills for glucose readings.

---

### 2026-04-30 — Sidebar dropped, You hub created (same commit as above)

**Problem.** Mobile-first usage, but desktop sidebar was taking up real
estate and duplicating the bottom nav. Quick Log section on Dashboard was
redundant with the new tile grid.

**What changed.**
- `Layout.jsx`: desktop sidebar removed entirely. Floating pill bottom-nav
  now the only navigation at every screen size. Five tabs: **Today / Meds
  / Glucose / Weight / You**. Active-tab pill slides between items via
  shared `layoutId`. Header still shows current page title (resolved from
  a route-label map so secondary pages reached via You hub get a real
  title).
- `Dashboard.jsx`: Quick Log section deleted.
- `Settings.jsx` rebuilt as the **You hub**: top-of-page nav cards
  ("Tracking" group: Well-being, Nutrition, Side Effects; "Analysis"
  group: Insights, Reports, Learn) followed by the existing settings
  sections under a Settings eyebrow.

---

### 2026-04-30 — Tare rebrand: warm wood palette + framer-motion animations (commits `1a44947` → `2dab5f8`)

**Problem.** App needed a coherent visual identity. User wanted a warm
wood-toned palette (amber/brown), modern layout from Image 391, and
animations from the design folder (`design/`).

**What shipped.**
- **Brand:** "Tare" everywhere user-facing (login, header, browser title).
  Tagline "Reset to baseline. Every week." Capsule logomark (half amber,
  half cream).
- **Color system:** `tailwind.config.js` repainted. `brand-*` from cyan to
  warm amber/honey. New `wood-*` neutrals. Per-category soft tints
  (`meds`, `glu`, `weight`, `active` — terracotta, muted ocean, dusty
  plum, moss). Inter Tight for display headings.
- **Animation library:** framer-motion 12.x. Primitives in
  `src/components/motion/primitives.jsx` — `Stagger`, `StaggerItem`,
  `FadeUp`, `ChartReveal`, `CountUp`, shared `ease` curves. Per-page hero
  animations in `PageHero.jsx` — glucose droplet falls + ripples + gauge
  ring; meds capsule rotates in + splits; weight dial slides up + needle
  oscillates. Plays on every navigation, tap-to-skip, respects
  `prefers-reduced-motion`. First-launch IntroAnimation: orbital dots
  collapse, capsule scales in with overshoot, "Tare" wordmark types in.
- **Dashboard:** Image 391 layout grafted on top of existing data. 2x2
  staggered tile grid (Next Dose / Weight / Glucose / Well-being)
  followed by journey timeline widget (kept from concurrent remote work),
  injection-due nudge, split 30-day chart (weight + glucose panels with
  thresholds), protein/water cards, well-being grid.
- **Routing:** `App.jsx` wraps `<Routes>` in `<AnimatePresence>` for
  crossfade transitions. Intro plays before app shell on first session.

**Notes.** `design/` folder contains the original animation references
(scenes.jsx, animations.jsx, README.md, Image 391/392). They're not
production code but kept in the repo for future redesigns.

---

### 2026-04-24 — Per-stage Insights rewrite (commit `b43947f`)

**Problem.** Insights page was buggy and irrelevant: "25 days since last
injection" bug (read `injections[length-1]` on a DESC-ordered array,
picking the oldest). Useless protein-vs-glucose scatter chart (no meal
tracking). Hydration and sleep cards (not tracked). Discouraging tone
for diabetic working downward.

**What shipped.**
- `src/utils/insights.js` (new): pure analysis functions for dose stages,
  glucose trends, weight stats, time-in-range distribution, injection
  cadence, encouraging-tone insight generation.
- `src/pages/Insights.jsx` rewritten. New sections:
  - Smart insight cards (encouraging language for pre-diabetic and
    "early progress" ranges)
  - Dose Stage Progress timeline with "Coming up" preview
  - Glucose Journey chart (all-time, fasting + all-readings, dose markers)
  - Weight Journey chart (all-time, goal line, dose markers)
  - Time in Range distribution
  - Outcomes by Dose Stage (per-stage card with what-to-expect copy)
  - Injection Cadence bar chart
- Per-medication "what to expect" copy (Mounjaro/Zepbound for
  tirzepatide, Ozempic/Wegovy for semaglutide) at every dose level.

---

### 2026-04-24 — Better-sqlite3 v12 bump for Node 24 (commit `ec64d8d`)

**Problem.** Node 24 newly available via winget. Better-sqlite3 v9.4.3
ships no prebuilts for Node 24, forcing a node-gyp compile that fails
without Python and MSVC build tools.

**Fix.** Bumped to `^12.9.0`. v12 ships native prebuilds for Nodes 20–24.
Surface API used in `server.js` (`.prepare/.run/.get/.all/.exec/.transaction`)
is identical between v9 and v12 — no code change needed. Existing
`glp1.db` SQLite format is unchanged.

---

### 2026-04-24 — Knowledge Base (commit `ebd2d96`, before the rebrand)

**Problem.** Wanted an in-app educational reference for GLP-1 mechanism,
glucose, A1C, eating well, dose-stage expectations.

**What shipped.**
- `src/data/knowledgeBase.js`: 10 topics, each with simple + scientific
  views, FAQ, and tokenized search.
- `src/pages/KnowledgeBase.jsx`: searchable topic list with category
  chips, detail view with Simple/Scientific toggle, expandable FAQ,
  prev/next topic navigation.
- `src/components/knowledge/Diagrams.jsx`: 6 inline SVG medical diagrams
  (GLP-1 mechanism, glucose curve, A1C window, carb absorption, balanced
  plate, spike types).

Topics cover: what GLP-1s are, what glucose is, what A1C is, how carbs
affect glucose, how to eat on GLP-1s, temporary vs lasting spikes, plus
injection basics, side effects, hypoglycemia, movement, sleep/stress,
reading your data.

---

## Operations

### Env vars in production

```env
PRIMARY_USER_OID=<your-oid>
AAD_TENANT_ID=<your-aad-tenant-id>
AAD_CLIENT_ID=<your-aad-client-id>
ANTHROPIC_API_KEY=...          # optional, enables AI
```

`USERS_DIR` defaults to `/data/users` in Docker. `LEGACY_DB_PATH` defaults
to `/data/glp1.db`. Both can be overridden if needed but rarely should be.

### Finding your AAD oid

Sign into [jwt.ms](https://jwt.ms) with the relevant Microsoft account.
The decoded token's `oid` claim is the value to use.

### Per-user DB paths

```sh
docker exec glp1-tracker ls /data/users/
```

Each file is named `{oid}.db` where `oid` is the user's Azure AD object ID.

To inspect:
```sh
docker exec glp1-tracker ls /data/users/
docker exec glp1-tracker sqlite3 /data/users/<oid>.db '.schema'
```

### Backup/restore

Per-user from the app: Settings → Backup & Restore. Each user's export
contains only their own data. Restore replaces the current user's DB
contents (atomic transaction; failed import rolls back).

For full-disk backups before risky migrations:
```sh
docker exec glp1-tracker sh -c "cd /data && tar czf - users 2>/dev/null" > snapshot.tgz
```

### Pre-deploy data safety (when changing the data layer)

1. JSON export via Settings → Backup & Restore (saves to OneDrive or similar)
2. Binary tarball of `/data/users/` (above)
3. Round-trip rehearsal: restore the JSON into a sandbox container and
   confirm row counts match

---

## Maintaining this file

When you finish substantial work:

1. Add a new section at the top of "Work history" with format
   `### YYYY-MM-DD — Title (commit <sha>)`.
2. Capture the **problem**, **approach**, **what shipped**, and any
   **decisions made** with rejected alternatives.
3. If the change locks in an architectural decision, also add it to the
   "Locked-in architecture decisions" list near the top.
4. Commit the file alongside the work itself so the context lands together.

Brevity is fine — this is a journal, not a textbook. The goal is enough
detail that future-you (or future Claude) understands *why* things are
the way they are without re-reading the whole git log.
