# Tare (GLP-1 Tracker) — Claude Code Project Memory

This file is loaded automatically by Claude Code when working in this repo.
It's the entry point for context — for the full work history and decisions
log, **read [docs/CONTEXT.md](docs/CONTEXT.md) before making structural changes**.

## What this app is

Single-developer personal health tracker, branded **Tare** ("Reset to baseline.
Every week."). Tracks GLP-1 medication, glucose, weight, side effects, and
well-being for the user and their spouse. Each user has their own SQLite
database — one user never sees another's data.

The repo and URLs keep the historical `glp1` paths for stability; user-facing
brand is Tare.

## Stack

- **Frontend:** Vite + React 18 + framer-motion + Tailwind CSS, warm wood
  palette in [tailwind.config.js](tailwind.config.js). Inter Tight for display headings.
- **Backend:** Express 5 + better-sqlite3 (v12 for Node 24 prebuilts). Per-user
  DB at `/data/users/{oid}.db` resolved per request from the AAD `oid` claim.
- **Auth:** Microsoft Entra ID (MSAL). ID tokens validated server-side via
  `jose` against tenant + client + JWKS.
- **AI features:** Optional Anthropic SDK calls for nutrition/glucose insights
  and Knowledge Base Q&A.
- **Deploy:** GitHub Actions auto-deploy on push to `master`.

## Conventions verified across sessions

- **Single dev workflow** — pushing directly to `master` is approved and
  expected. Auto-deploy fires on each push. Permission rules in
  `.claude/settings.local.json` (gitignored) allow this without prompts.
- **Card chrome** — cards use warm ivory `bg-[#fffaf3]` (no `bg-white`). See
  [src/components/ui/Card.jsx](src/components/ui/Card.jsx).
- **Animation primitives** — reuse `Stagger`, `StaggerItem`, `FadeUp`,
  `ChartReveal`, `CountUp`, `ease` from
  [src/components/motion/primitives.jsx](src/components/motion/primitives.jsx). Per-page hero
  animations (glucose droplet, meds capsule, weight dial) live in
  [src/components/motion/PageHero.jsx](src/components/motion/PageHero.jsx).
- **DB schema** — single source of truth is the `SCHEMA_SQL` constant in
  [server.js](server.js); add ALTER migrations to `applyMigrations()` for backward
  compatibility — they run on every per-user DB on first open.
- **Insights utilities** — pure analysis functions in
  [src/utils/insights.js](src/utils/insights.js) (dose stages, glucose trends,
  weight stats, A1C estimate). Reuse them rather than reimplementing.

## Don't

- **Don't reintroduce `bg-white` on cards** — explicitly themed away to warm
  ivory.
- **Don't add `userId` columns to tables** — per-user DBs replaced that
  approach. Don't centralize back to a shared DB.
- **Don't bypass the auth middleware** — every `/api/*` route except
  `/api/health` must go through `requireAuth` + `withUserDb`.
- **Don't push to master without confirming** for risky changes — auto-deploy
  fires immediately. Routine commits are fine.
- **Don't remove the OnboardingWizard gate** — it's the only thing that
  ensures required profile fields exist before the dashboard renders.

## Per-session journaling (Enzo's workflow)

At the end of substantial work, append a section to [docs/CONTEXT.md](docs/CONTEXT.md)
under "## YYYY-MM-DD — Title" summarizing what changed and why. The file
syncs via git so any machine sees the same context.

## Operations

- **Production env vars:** see "Operations → Env vars in production" in
  [docs/CONTEXT.md](docs/CONTEXT.md).
- **Finding your AAD `oid`:** sign into [jwt.ms](https://jwt.ms) with your
  Microsoft account, copy the `oid` claim. That's your stable identity for
  `PRIMARY_USER_OID` and per-user DB paths.
