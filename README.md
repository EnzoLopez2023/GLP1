# Tare — GLP-1 Health Tracker

> **Tare** /tɛr/ — *In measurement, tare means resetting the scale to zero so you only measure what actually changed. Every injection day is a new baseline.*

A personal health companion built for people navigating GLP-1 treatment (Ozempic, Mounjaro, Wegovy, etc.). Tracks glucose readings, injections, weight, nutrition, side effects, and well-being — all in one place, per user, with full data ownership.

---

## What it tracks

| Feature | Details |
|---|---|
| **Injections** | Dose history, titration stage, injection sites |
| **Blood glucose** | Fasting, post-meal, and random readings with trend charts and estimated A1C |
| **Nutrition** | Daily macros, per-meal logs, water intake, carb budget |
| **Weight** | Progress log with goal tracking and body measurements |
| **Side effects** | Symptom log with severity ratings and free-form notes |
| **Well-being** | Daily mood, energy, hunger, and sleep journal |
| **Progress photos** | Date-stamped comparison photos stored in SQLite |
| **AI insights** | Glucose/carb correlation analysis and GLP-1 Q&A (optional, requires API key) |
| **Reports & export** | 30-day summaries, full JSON backup, per-dataset CSV export |
| **Knowledge base** | Curated articles on GLP-1 pharmacology, keto, and glucose management |

---

## Tech stack

### Frontend

| Library | Version | Role |
|---|---|---|
| React | 18.2 | UI framework |
| Vite | 5 | Dev server + production build |
| Tailwind CSS | 3.4 | Utility-first styling |
| Framer Motion | 12 | Page transitions and cinematic hero animations |
| React Router | 6.22 | Client-side routing |
| Recharts | 2.10 | Charts and data visualization |
| lucide-react | 0.344 | Icon library |
| react-hot-toast | 2.4 | Toast notifications |
| @headlessui/react | 1.7 | Accessible unstyled UI primitives |
| date-fns | 3.3 | Date formatting and math |
| clsx | 2.1 | Conditional class names |

### Backend

| Library | Version | Role |
|---|---|---|
| Node.js | 20 (Alpine) | Runtime |
| Express | 5.0 | HTTP framework |
| better-sqlite3 | 12.9 | Synchronous SQLite driver |
| jose | 6.2 | JWT validation against Azure AD JWKS |
| uuid | 9 | Row ID generation |
| cors | 2.8 | CORS middleware |
| dotenv | 17 | `.env` loading |

### Auth

| Library | Version | Role |
|---|---|---|
| @azure/msal-browser | 5.8 | Token acquisition in the browser |
| @azure/msal-react | 5.3 | React hooks and components for MSAL |

The frontend acquires an ID token from Azure AD via MSAL and passes it as a `Bearer` token on every API request. The backend validates the token against the tenant's JWKS endpoint using `jose`, extracts the `oid` claim, and opens (or creates) that user's dedicated SQLite database. No user ever touches another's data — isolation is at the filesystem level.

### AI (optional)

Powered by `@anthropic-ai/sdk` 0.88 using `claude-haiku-4-5-20251001` (fast, low-cost). The app boots and runs fully without an API key — AI routes return a friendly error instead of crashing.

### Infrastructure

| Tool | Role |
|---|---|
| Docker + Compose | Containerized deployment |
| GitHub Actions (self-hosted) | CI/CD on push to `master` |
| SQLite | Per-user database files at `/data/users/{oid}.db` |

---

## Architecture overview

```
Browser (React + MSAL)
      │  Bearer ID token on every request
      ▼
Express server  (server.js — single file)
      │
      ├── requireAuth middleware
      │     validates JWT via AAD JWKS
      │     extracts oid claim
      │
      ├── withUserDb middleware
      │     opens (or creates) /data/users/{oid}.db
      │     injects db handle into req
      │
      ├──► SQLite per-user DB
      │       profile · settings · injections · glucose
      │       nutrition · meals · weightLog · measurements
      │       wellbeing · sideEffects · photos
      │
      └──► Anthropic API  (optional — /api/ai/* routes only)
```

Every `/api/*` route except `/api/health` requires a valid token.

---

## Database schema

Each user's database is created lazily on their first API request. WAL mode and foreign keys are always on.

> **Schema changes:** There is no migration framework. Add new columns via `ALTER TABLE … ADD COLUMN … IF NOT EXISTS` statements in the `applyMigrations()` function in `server.js`. This function runs against every per-user DB on first open.

### `profile` — singleton (id = 1)
```
name, age, weightLbs, heightIn, goalWeightLbs
medicationName, startingDoseMg, currentDoseMg, escalationSchedule
startDate, diagnosisDate, ketoStartDate, appointmentDate
injectionDay, injectionTime, notes
```

### `settings` — singleton (id = 1)
```
weightUnit, glucoseUnit, heightUnit, waterUnit
theme, notifications, notificationTime
injectionDay, injectionTime, carbGoalG
```

### `injections`
```
id, injectedAt (ISO timestamp), medicationName, doseMg, site, notes
```

### `sideEffects`
```
id, loggedAt, symptom, severity (1–10), notes
```

### `nutrition` — unique by date
```
id, date, proteinG, carbsG, fatG, caloriesKcal, waterOz, notes
```

### `meals`
```
id, date, mealType, name, proteinG, carbsG, fatG, caloriesKcal, notes
```

### `glucose`
```
id, readingAt (ISO timestamp), readingType (fasting | post-meal | random), value (mg/dL), notes
```

### `weightLog` — unique by date
```
id, date, weightLbs, notes
```

### `measurements`
```
id, date, waist, hips, chest, neck, leftArm, rightArm, leftThigh, rightThigh, notes
```

### `wellbeing` — unique by date
```
id, date, mood (1–5), energy (1–5), hunger (1–5), sleepHours, sleepQuality (1–5), notes
```

### `photos`
```
id, date, label, dataUrl (base64 JPEG/PNG)
```

---

## Local development

### Prerequisites

- **Node.js 20+**
- **An Azure AD app registration** — see [Auth setup](#auth-setup) below (required even for local dev)

### 1. Clone and install

```bash
git clone <repo-url>
cd GLP-1
npm install
```

### 2. Create your `.env`

```env
# Azure AD — required (see Auth setup below for where to find these)
AAD_TENANT_ID=<your-tenant-id>
AAD_CLIENT_ID=<your-client-id>
PRIMARY_USER_OID=<your-aad-object-id>

# Anthropic — optional (enables AI insights and Q&A)
ANTHROPIC_API_KEY=sk-ant-...

# Server — optional overrides
PORT=3004
USERS_DIR=./data/users
```

`PRIMARY_USER_OID` is your stable Azure AD object ID. Find it by signing into [jwt.ms](https://jwt.ms) with your Microsoft account and copying the `oid` claim from the decoded token.

### 3. Set your Azure AD credentials in the frontend

Open [`src/auth/msalConfig.js`](src/auth/msalConfig.js) and fill in:

```js
const clientId = '<your-application-client-id>'
const tenantId = '<your-directory-tenant-id>'
```

These are the same values as `AAD_CLIENT_ID` and `AAD_TENANT_ID` in your `.env`.

### 4. Start both servers

Open two terminals:

```bash
# Terminal 1 — Express API on :3004
npm run start

# Terminal 2 — Vite dev server on :3000 (proxies /api → :3004)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to Microsoft sign-in on first load.

### Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server on `:3000` with hot module replacement |
| `npm run start` | Express API server on `:3004` |
| `npm run build` | Production Vite build → `./dist` |
| `npm run preview` | Serve the built `./dist` on `:3000` |

---

## Auth setup

Tare uses **Microsoft Entra ID (Azure AD)** for authentication. You need an app registration even for local development.

### Create an app registration

1. Go to [portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**
2. Give it any name (e.g. `Tare Dev`)
3. **Supported account types:** choose what fits your situation — personal Microsoft accounts, a specific tenant, or multi-tenant
4. **Redirect URI:** Platform = **Single-page application (SPA)**, URI = `http://localhost:3000`

### Collect the required values

From your app registration's **Overview** page:

| Field | Where | Used as |
|---|---|---|
| Application (client) ID | Overview | `AAD_CLIENT_ID` / `clientId` in `msalConfig.js` |
| Directory (tenant) ID | Overview | `AAD_TENANT_ID` / `tenantId` in `msalConfig.js` |

### For production

Add your production origin (e.g. `https://glp1.yourdomain.com`) as an additional SPA redirect URI under **Authentication**. No new registration needed — one registration handles all environments.

---

## API reference

All routes require `Authorization: Bearer <id_token>` except `/api/health`.

### Health
```
GET  /api/health
```

### Profile & Settings
```
GET  /api/profile
PUT  /api/profile

GET  /api/settings
PUT  /api/settings
```

### Injections
```
GET    /api/injections[?limit=N]
POST   /api/injections        { injectedAt, medicationName, doseMg, site, notes }
DELETE /api/injections/:id
```

### Blood Glucose
```
GET    /api/glucose[?from=DATE&to=DATE&type=TYPE]
POST   /api/glucose           { readingAt, readingType, value, notes }
DELETE /api/glucose/:id
```

### Nutrition
```
GET  /api/nutrition/today
GET  /api/nutrition[?from=DATE&to=DATE]
PUT  /api/nutrition/:date     { proteinG, carbsG, fatG, caloriesKcal, waterOz, notes }
```

### Meals
```
GET    /api/meals[?date=DATE]
POST   /api/meals             { date, mealType, name, proteinG, carbsG, fatG, caloriesKcal, notes }
DELETE /api/meals/:id
```

### Weight
```
GET    /api/weightlog
POST   /api/weightlog         { date, weightLbs, notes }
DELETE /api/weightlog/:id
```

### Measurements
```
GET    /api/measurements
POST   /api/measurements      { date, waist, hips, chest, neck, leftArm, rightArm, leftThigh, rightThigh, notes }
DELETE /api/measurements/:id
```

### Well-being
```
GET  /api/wellbeing/today
GET  /api/wellbeing[?from=DATE&to=DATE]
PUT  /api/wellbeing/:date     { mood, energy, hunger, sleepHours, sleepQuality, notes }
```

### Side Effects
```
GET    /api/sideeffects[?limit=N]
POST   /api/sideeffects       { loggedAt, symptom, severity, notes }
DELETE /api/sideeffects/:id
```

### Progress Photos
```
GET    /api/photos              (metadata only — no dataUrl)
GET    /api/photos/:id/image    (full record with base64 dataUrl)
POST   /api/photos              { date, label, dataUrl }
DELETE /api/photos/:id
```

### Export & Import
```
GET   /api/export     → JSON attachment (all tables)
POST  /api/import     { ...same shape as export }    ⚠ replaces ALL existing data
```

### AI (requires `ANTHROPIC_API_KEY`)
```
POST  /api/ai/nutrition-glucose-insight   { nutrition, meals, glucoseReadings }
POST  /api/ai/ask                         { question, userContext }
```

---

## Docker deployment

### Deploy

```powershell
.\deploy.ps1
```

The script does exactly this:

1. `docker compose build` — three-stage image build (deps → builder → runner)
2. `docker compose up -d` — start or restart the container
3. 4-second wait for the server to initialize
4. Health check via `Invoke-RestMethod http://localhost:3004/api/health` — exits with code 1 if the server doesn't respond `{ status: 'ok' }`

### Dockerfile stages

| Stage | Base | Purpose |
|---|---|---|
| `deps` | node:20-alpine | `npm ci --omit=dev` — prod dependencies only |
| `builder` | node:20-alpine | `npm ci` + `npm run build` — compiles the Vite frontend |
| `runner` | node:20-alpine | Copies prod `node_modules` + built `dist/` + `server.js` |

### Data persistence

User databases live in the Docker named volume `glp1-data` at `/data/users/` inside the container. Rebuilding the image never touches the volume — your data survives deploys.

### Environment in Docker

Place your `.env` next to `docker-compose.yml` — Compose reads it automatically. Required vars:

```env
AAD_TENANT_ID=...
AAD_CLIENT_ID=...
PRIMARY_USER_OID=...
ANTHROPIC_API_KEY=...   # optional
```

---

## CI/CD — GitHub Actions

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) triggers on every push to `master` and supports manual dispatch.

**Runner:** self-hosted Windows server  
**Concurrency:** `cancel-in-progress: false` — a running deploy is never interrupted by a new push

**Steps:**
1. `git fetch --all --prune && git reset --hard origin/master` — hard-sync the working tree
2. `docker compose build` — rebuild the image
3. `docker compose up -d` — restart the container
4. 4-second wait
5. `Invoke-RestMethod http://localhost:3004/api/health` — fails the workflow if the server doesn't respond healthy

---

## Design system

The app uses a custom warm color palette defined in [`tailwind.config.js`](tailwind.config.js):

| Scale | Tone | Used for |
|---|---|---|
| `brand-*` | Warm amber | Primary actions, active states, highlights |
| `wood-*` | Warm cream → dark brown | Page backgrounds, body text, card borders |
| `meds-*` | Terracotta | Injection and medication accents |
| `glu-*` | Ocean blue | Glucose chart accents |
| `weight-*` | Plum | Weight and progress accents |
| `active-*` | Moss green | Nutrition and activity accents |

**Key rules:**
- Cards use `bg-[#fffaf3]` (warm ivory). Never `bg-white` — it's explicitly themed away.
- Display headings use **Inter Tight**. Body text uses **Inter**.
- Reuse animation primitives (`Stagger`, `FadeUp`, `ChartReveal`, `CountUp`, etc.) from [`src/components/motion/primitives.jsx`](src/components/motion/primitives.jsx).
- Page-load cinematic hero animations live in [`src/components/motion/PageHero.jsx`](src/components/motion/PageHero.jsx) and are automatically skipped on mobile and when the OS "Reduce Motion" preference is enabled.

---

## Environment variables reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3004` | HTTP port the Express server listens on |
| `USERS_DIR` | `./data/users` | Directory where per-user SQLite files are stored |
| `LEGACY_DB_PATH` | `./glp1.db` | Path to old single-user DB — triggers one-time migration when `PRIMARY_USER_OID` is set |
| `AAD_TENANT_ID` | *(hardcoded fallback)* | Azure AD directory (tenant) ID |
| `AAD_CLIENT_ID` | *(hardcoded fallback)* | Azure AD application (client) ID |
| `PRIMARY_USER_OID` | — | Your AAD `oid` claim — used to migrate a legacy single-user DB on first run |
| `ANTHROPIC_API_KEY` | — | Enables `/api/ai/*` endpoints. Omitting it disables AI features gracefully. |

---

## Project structure

```
GLP-1/
├── server.js                     # Entire backend — schema, auth, routes, AI
├── src/
│   ├── App.jsx                   # Router, auth gate, onboarding wizard gate
│   ├── main.jsx                  # React root + MSAL provider
│   ├── api/
│   │   └── client.js             # All API methods + MSAL token acquisition
│   ├── auth/
│   │   └── msalConfig.js         # Azure AD client + tenant config
│   ├── components/
│   │   ├── motion/
│   │   │   ├── PageHero.jsx      # Cinematic page-load hero animations
│   │   │   └── primitives.jsx    # Reusable Framer Motion building blocks
│   │   ├── onboarding/
│   │   │   └── OnboardingWizard.jsx  # First-launch 4-step profile setup
│   │   └── ui/                   # Shared UI — Button, Card, Modal, FormField…
│   ├── data/
│   │   └── knowledgeBase.js      # Static article content for the Learn page
│   ├── hooks/
│   │   └── useQuery.js           # Minimal fetch/cache hook
│   ├── pages/                    # One file per route
│   │   ├── Dashboard.jsx
│   │   ├── BloodGlucose.jsx
│   │   ├── Medication.jsx
│   │   ├── Nutrition.jsx
│   │   ├── Progress.jsx
│   │   ├── SideEffects.jsx
│   │   ├── Wellbeing.jsx
│   │   ├── Insights.jsx
│   │   ├── Reports.jsx
│   │   ├── KnowledgeBase.jsx
│   │   └── Settings.jsx
│   └── utils/
│       ├── constants.js          # MEDICATIONS list and dose schedules
│       ├── insights.js           # Pure analysis — dose stage, A1C estimate, trends
│       ├── exportHelpers.js      # JSON/CSV download utilities
│       └── dateHelpers.js        # Date formatting helpers
├── Dockerfile
├── docker-compose.yml
├── deploy.ps1                    # One-command Docker deploy (PowerShell 5.1)
├── vite.config.js                # Dev server on :3000, proxies /api → :3004
├── tailwind.config.js            # Custom warm color palette + typography
└── .github/
    └── workflows/
        └── deploy.yml            # Self-hosted GitHub Actions CI/CD
```

---

## Developer notes

- **New API routes:** Add a prepared statement to the `stmts` object at the top of `server.js`, then wire up the route in the relevant section. Follow the `// ── Section ──────────────────` header style used throughout.
- **New pages:** Add a `<Route>` in `App.jsx` and a nav link in the layout. Wrap the page's return in `<PageHero variant="yourVariant">` and register the variant in `PageHero.jsx` if you want a hero animation.
- **Schema changes:** Edit the `CREATE TABLE IF NOT EXISTS` block in `server.js` and add an `ALTER TABLE … ADD COLUMN … IF NOT EXISTS` to `applyMigrations()`. No migration runner needed — it runs on every DB open.
- **Cards:** Always use the `Card` component or manually apply `bg-[#fffaf3]`. The warm ivory background is intentional and `bg-white` is explicitly avoided.
- **Never commit:** `.env`, `*.db`, `*.db-wal`, `*.db-shm`, `node_modules/`, `dist/`
