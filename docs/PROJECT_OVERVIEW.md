# The Investing League Decision Lab — Complete Project Documentation

Educational decision-support and trade journaling SaaS built from the **V4 Power Engine** HTML template.

- **Production:** https://investing-league-seven.vercel.app
- **Repository:** https://github.com/aj-academy/Investing-League

---

## Table of Contents

1. [Product Summary](#1-product-summary)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Variables](#4-environment-variables)
5. [Architecture](#5-architecture)
6. [Authentication & Access Control](#6-authentication--access-control)
7. [API Reference & Workflows](#7-api-reference--workflows)
8. [Market Data Layer](#8-market-data-layer)
9. [V4 Signal Engine](#9-v4-signal-engine)
10. [Database Schema](#10-database-schema)
11. [Row Level Security](#11-row-level-security)
12. [Pages & UI](#12-pages--ui)
13. [Journal & Analytics Logic](#13-journal--analytics-logic)
14. [User Journeys](#14-user-journeys)
15. [Troubleshooting](#15-troubleshooting)
16. [Security Model](#16-security-model)
17. [Deployment Checklist](#17-deployment-checklist)
18. [Development Commands](#18-development-commands)
19. [Visual Migration Map](#19-visual-migration-map)
20. [Migrations & SQL](#20-migrations--sql)
21. [Historical Notes](#21-historical-notes)

---

## 1. Product Summary

| Area | Purpose |
|------|---------|
| **Scanner** | Fetches FX OHLC candles, runs V4 rules, shows graded CALL/PUT setups |
| **Journal** | Records each scan as journal rows; mark Win/Loss/Refund and broker quotes |
| **Analytics** | Win rate, pair stats, loss reasons (real trades vs observation-only) |
| **Settings** | Profile, scanner defaults, **risk disclaimer** (required before scan) |
| **Admin** | Usage stats (admin role only) |

**Positioning:** Educational analysis, signal testing, and trade journaling only. No profit guarantees. Users are responsible for their own trading decisions.

**Supported pairs:** EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, NZD/USD, EUR/GBP.

**Timeframes:** 5min, 15min (and "both" in scanner UI).

**Modes:**

- **Practice** — Shows all filtered signals for learning and journal analytics.
- **Live** — Selects only the best signal per scan window; downgrades others to Watch / Correlation Risk.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 + `app/globals.css` (template port from original HTML) |
| Auth & Database | Supabase Auth + PostgreSQL + Row Level Security (RLS) |
| Market Data | Twelve Data REST API (server-side only) |
| Hosting | Vercel |
| Notifications | Sonner (toast messages) |
| Utilities | `clsx`, `tailwind-merge` (`cn()` in `lib/utils.ts`) |

### Dependencies (`package.json`)

- `@supabase/ssr` — cookie-based auth in middleware and server components
- `@supabase/supabase-js` — database client
- `next`, `react`, `react-dom`
- `sonner`, `clsx`, `tailwind-merge`

---

## 3. Folder Structure

```
trading/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout, fonts, Toaster
│   ├── page.tsx                      # Landing page (/)
│   ├── globals.css                   # Template CSS + app shell + responsive sidebar
│   ├── login/
│   │   └── page.tsx                  # Login + Sign up tabs
│   ├── dashboard/
│   │   └── page.tsx                  # Server: load user_settings → DashboardClient
│   ├── journal/
│   │   └── page.tsx                  # Trade journal list
│   ├── analytics/
│   │   └── page.tsx                  # Performance analytics
│   ├── settings/
│   │   └── page.tsx                  # Profile & scanner defaults
│   ├── admin/
│   │   └── page.tsx                  # Admin dashboard
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              # Email confirm / OAuth code exchange
│   └── api/                          # Route Handlers (server-only secrets)
│       ├── settings/
│       │   └── route.ts              # PATCH profile + user_settings
│       ├── signals/
│       │   └── scan/
│       │       └── route.ts          # POST run V4 scan
│       ├── market/
│       │   ├── candles/
│       │   │   └── route.ts          # POST single pair OHLC
│       │   └── ticker/
│       │       └── route.ts          # GET all pairs ticker (batched)
│       ├── journal/
│       │   └── update/
│       │       └── route.ts          # PATCH journal row
│       ├── export/
│       │   ├── csv/route.ts
│       │   └── json/route.ts
│       └── admin/
│           └── usage/route.ts
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── layout/
│   │   ├── AppShell.tsx              # Sidebar + main + mobile drawer
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── ProtectedShell.tsx        # Server wrapper, admin flag
│   ├── dashboard/
│   │   ├── DashboardClient.tsx       # Scanner orchestration
│   │   ├── SignalCard.tsx
│   │   ├── MarketTicker.tsx
│   │   ├── ScannerControls.tsx
│   │   ├── SessionPills.tsx
│   │   ├── StatsRow.tsx
│   │   ├── SupportPanel.tsx
│   │   ├── LoadingScanner.tsx
│   │   ├── DataProviderStatus.tsx
│   │   ├── RiskDisclaimerBanner.tsx
│   │   └── MiniChart.tsx
│   ├── journal/
│   │   ├── JournalClient.tsx
│   │   ├── JournalTable.tsx
│   │   ├── JournalStats.tsx
│   │   └── ExportButtons.tsx
│   ├── analytics/
│   │   └── AnalyticsView.tsx
│   ├── settings/
│   │   └── SettingsForm.tsx
│   └── admin/
│       └── AdminView.tsx
│
├── lib/
│   ├── signal-engine/                # Pure TypeScript — V4 logic (no React/DB)
│   │   ├── index.ts                  # computeSignal, filterSignals
│   │   ├── types.ts
│   │   ├── indicators.ts             # EMA, RSI, MACD, ADX, ATR, etc.
│   │   ├── patterns.ts
│   │   ├── marketStructure.ts
│   │   ├── scoring.ts                # computeBaseSignal
│   │   ├── classification.ts         # classifyV4, V4 thresholds
│   │   ├── cooldown.ts
│   │   ├── correlation.ts
│   │   ├── liveSelector.ts
│   │   └── session.ts
│   ├── market/
│   │   ├── twelveData.ts             # Twelve Data API client
│   │   ├── candleCache.ts            # In-memory TTL cache
│   │   └── cachedCandles.ts          # Memory + Supabase + API
│   ├── auth/
│   │   ├── session.ts                # getAuthContext (server)
│   │   ├── apiAuth.ts                # requireApiAuth for API routes
│   │   └── profile.ts                # Service role profile reads
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server Components / Route Handlers
│   │   └── admin.ts                  # Service role client
│   ├── journal/
│   │   ├── entryDrift.ts
│   │   ├── resultCalculator.ts
│   │   ├── exportCsv.ts
│   │   └── exportJson.ts
│   ├── analytics/
│   │   ├── summary.ts
│   │   ├── winRate.ts
│   │   └── pairStats.ts
│   └── utils.ts                      # PAIRS, DISCLAIMER, cn(), helpers
│
├── supabase/
│   ├── schema.sql                    # Tables + signup trigger
│   ├── rls.sql                       # RLS policies
│   └── migrations/
│       ├── 20260530_auth_trigger_disclaimer.sql
│       ├── 20260530_fix_missing_profiles.sql
│       └── 20260531_profiles_rls_insert.sql
│
├── docs/
│   └── PROJECT_OVERVIEW.md           # This file
│
├── middleware.ts                     # Auth gate + admin route check
├── .env.example
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## 4. Environment Variables

Copy `.env.example` to `.env.local` for local development. Set the same values in **Vercel → Settings → Environment Variables** for production.

| Variable | Required | Used By |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser + server Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser + server (RLS as logged-in user) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server: settings profile upsert, disclaimer check, market_cache writes |
| `TWELVE_DATA_API_KEY` | Yes | Server: candle / ticker / scan market data |
| `NEXT_PUBLIC_APP_URL` | Recommended | Redirects (e.g. `https://investing-league-seven.vercel.app`) |

**Never expose** `SUPABASE_SERVICE_ROLE_KEY` or `TWELVE_DATA_API_KEY` to the browser.

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                         │
│  Pages: /, /login, /dashboard, /journal, /analytics, /settings  │
│  Client components: forms, scanner, ticker, journal table        │
└────────────────────────────┬────────────────────────────────────┘
                             │ fetch() to /api/*
                             │ Supabase auth cookies
┌────────────────────────────▼────────────────────────────────────┐
│                    Next.js Server (Vercel)                       │
│  middleware.ts ──► session refresh, route protection               │
│  Server Components ──► load settings, journal, analytics           │
│  API Routes ──► auth, scan, market, settings, journal, export      │
│  lib/signal-engine ──► pure computation                            │
│  lib/market ──► Twelve Data + cache                                │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
    ┌────────▼────────┐             ┌────────▼────────┐
    │    Supabase     │             │   Twelve Data   │
    │  Auth + Postgres│             │   time_series   │
    │  + RLS          │             │   API           │
    └─────────────────┘             └─────────────────┘
```

### Request flow: Scan Market

```
User clicks SCAN MARKET
    → DashboardClient.runScan()
    → POST /api/signals/scan
        → requireApiAuth()
        → hasAcceptedRiskDisclaimer() [service role]
        → For each pair × timeframe:
            → getMarketCandles() [memory → DB cache → Twelve Data]
            → computeSignal(ohlc, pair, tf, mode, journalHistory)
        → filterSignals() [grade, minScore, session, live mode]
        → Upsert signals + trade_journal rows
        → Insert usage_logs
    → JSON { signals } → render SignalCard components
```

---

## 6. Authentication & Access Control

### Sign up

1. User fills **Sign Up** tab on `/login`.
2. `SignupForm` calls `supabase.auth.signUp()` with metadata: `full_name`, `risk_disclaimer_accepted`.
3. If email confirmation is enabled: toast asks to check inbox; no session yet.
4. If confirmation disabled: session created → redirect `/dashboard`.
5. DB trigger `handle_new_user` inserts `profiles` + `user_settings`.

### Login

1. `LoginForm` → `signInWithPassword`.
2. Middleware sees user on `/login` → redirect `/dashboard`.

### Email confirmation

1. User clicks link in email (must point to production URL, not localhost).
2. Redirect to `/auth/callback?code=...`.
3. `exchangeCodeForSession(code)` → cookies set → redirect `/dashboard`.

### Middleware (`middleware.ts`)

| Path | Behavior |
|------|----------|
| `/dashboard`, `/journal`, `/analytics`, `/settings`, `/admin` | Require authenticated user |
| `/login` | If logged in → redirect `/dashboard` |
| `/admin` | Require `profiles.role = 'admin'` |
| No Supabase env | Protected routes → `/login?setup=supabase` |

### API authentication

All `/api/*` routes (except public landing) use:

```typescript
const { auth, error } = await requireApiAuth();
if (error) return error; // 401 JSON
// auth.user.id, auth.user.email
```

### Risk disclaimer gate

| Step | Implementation |
|------|----------------|
| Save | `PATCH /api/settings` → service role upsert `profiles.risk_disclaimer_accepted` |
| Verify save | Response includes `riskDisclaimerAccepted: true` |
| Scan | `hasAcceptedRiskDisclaimer(userId)` via `lib/auth/profile.ts` (service role) |

Using service role for profile read/write avoids RLS mismatches where save succeeded but scan read returned no row.

---

## 7. API Reference & Workflows

### `PATCH /api/settings`

**Auth:** Required

**Request body:**

```json
{
  "fullName": "Jai Shankar",
  "riskDisclaimerAccepted": true,
  "defaultMode": "practice",
  "defaultTimeframe": "5min",
  "defaultMinScore": 5,
  "showBSignals": true
}
```

**Logic:**

1. Upsert `profiles` (service role): name, email, disclaimer flags.
2. Update or insert `user_settings` for scanner defaults.
3. Re-read profile to confirm disclaimer flag.

**Response:**

```json
{ "ok": true, "riskDisclaimerAccepted": true }
```

**Errors:** 400 (DB/RLS), 500 if `SUPABASE_SERVICE_ROLE_KEY` missing.

---

### `POST /api/signals/scan`

**Auth:** Required

**Pre-check:** `risk_disclaimer_accepted` must be true.

**Request body:**

```json
{
  "pairs": ["EUR/USD", "GBP/USD"],
  "timeframes": ["5min"],
  "mode": "practice",
  "minScore": 5,
  "showBSignals": true,
  "sessionFilter": "london"
}
```

**Logic:**

1. Validate pairs against `PAIRS` constant.
2. Load journal history (cooldown / correlation).
3. Fetch candles per pair × timeframe.
4. `computeSignal()` → `filterSignals()`.
5. Upsert `signals` and `trade_journal` (result: Pending).
6. Log `usage_logs` action `scan`.

**Response:**

```json
{
  "signals": [ /* ComputedSignal[] */ ],
  "connected": true
}
```

**Errors:**

- 403 — Disclaimer not accepted
- 500 — Market data failure, computation error

---

### `POST /api/market/candles`

**Auth:** Required

**Request body:**

```json
{
  "pair": "EUR/USD",
  "interval": "5min",
  "outputsize": 150
}
```

**Response:** `{ "candles": [{ "date", "open", "high", "low", "close" }] }`

**Validation:** Pair in `PAIRS`; interval `5min` or `15min`; outputsize 2–500.

---

### `GET /api/market/ticker`

**Auth:** Required

**Logic:** Loops all `PAIRS`, uses cached candles (outputsize 5), returns price and % change.

**Response:**

```json
{
  "items": [
    { "pair": "EUR/USD", "price": "1.08452", "chg": "▲0.012%", "up": true }
  ]
}
```

**Errors:** 503 if no market data (API key missing or credits exhausted).

---

### `PATCH /api/journal/update`

**Auth:** Required

**Purpose:** Update journal row with broker quotes, trade ID, loss reason; auto-calculate entry drift and Win/Loss/Refund.

**Key fields:** `journalId`, `olympOpeningQuote`, `olympClosingQuote`, `olympTradeId`, `lossReason`

---

### `GET /api/export/csv` | `GET /api/export/json`

**Auth:** Required

**Purpose:** Download user's `trade_journal` as CSV or JSON (optional query filters).

---

### `GET /api/admin/usage`

**Auth:** Required + admin role

**Returns:** User count, signals generated, journal records, recent usage logs.

---

### `GET /auth/callback`

**Purpose:** Exchange OAuth/email confirmation `code` for session.

**Query:** `code`, optional `next` (default `/dashboard`)

**Redirects:** Success → dashboard; failure → `/login?error=auth_callback`

---

## 8. Market Data Layer

### Files

| File | Role |
|------|------|
| `lib/market/twelveData.ts` | Calls `https://api.twelvedata.com/time_series` |
| `lib/market/candleCache.ts` | In-memory Map, 5-minute TTL |
| `lib/market/cachedCandles.ts` | Layered: memory → `market_cache` table → API |

### Twelve Data request

```
GET /time_series?symbol=EUR/USD&interval=5min&outputsize=150&apikey=...&format=JSON
```

Candles are reversed to chronological order and parsed to floats.

### Credit limits (free tier)

- ~**800 API credits per day**
- Exceeded → `429` / error message about daily limit
- Mitigations in app: single ticker endpoint, 5min cache, Supabase `market_cache`

### `market_cache` table

| Column | Purpose |
|--------|---------|
| `pair`, `interval`, `outputsize` | Unique cache key |
| `payload` | JSONB OHLC array |
| `fetched_at` | TTL check (5 minutes) |

Written with **service role**; readable by authenticated users (RLS).

---

## 9. V4 Signal Engine

Location: `lib/signal-engine/` — **pure TypeScript**, no React or database imports.

### Pipeline

```
OHLC[]
  → computeBaseSignal()        # Indicators, patterns, structure, score, CALL/PUT
  → enrichWithV4Metrics()      # ADX, candle body ratio, strength text
  → classifyV4()               # Signal type + trade eligibility + reasons
  → buildSignalUid()           # Unique id for deduplication
  → filterSignals()            # UI filters: grade, score, session, live selector
```

### Module reference

| Module | Exports / role |
|--------|----------------|
| `indicators.ts` | `M.ema`, `M.rsi`, `M.macd`, `M.adx`, `M.atr`, `M.stoch`, `M.cci`, `M.bb` |
| `patterns.ts` | `detectPatterns()` |
| `marketStructure.ts` | Trend, compression, `getSignalGrade`, category scores |
| `scoring.ts` | `computeBaseSignal`, `buildSignalUid` |
| `classification.ts` | `classifyV4`, `enrichWithV4Metrics`, V4 threshold constants |
| `cooldown.ts` | `historyFinals` — time since last FINAL trade on pair/TF |
| `correlation.ts` | Related pair risk in live mode |
| `liveSelector.ts` | `applyLiveSelector`, `rankSignal`, `isEligible` |
| `session.ts` | `sessionOk`, `getSessionQualityScore` |
| `types.ts` | `OHLC`, `ComputedSignal`, `JournalHistoryRow`, `TradingMode` |

### V4 thresholds (`classification.ts`)

Examples:

- `minFinalConf: 68`, `minStrongConf: 78`
- `minFinalScore: 7`, `minStrongScore: 8`
- `adx5: 16`, `adx15: 18`, `strongAdx: 22`
- `minBody: 28`, `strongBody: 38`, `maxBody: 82`
- Cooldown minutes: 5min TF → 10, 15min TF → 30

### Signal types

| Type | Meaning |
|------|---------|
| `STRONG FINAL` | Highest conviction setup |
| `FINAL TRADE` | Trade-eligible final setup |
| `WATCH ONLY` | Educational observation, not counted in real win rate |
| Correlation / cooldown messages | Downgraded in live mode or after recent finals |

### Grades

- **A+**, **A** — Primary setups
- **B** — Optional (controlled by `showBSignals` setting)

### Live vs Practice

| Mode | Behavior |
|------|----------|
| **practice** | All signals passing filters are returned |
| **live** | `applyLiveSelector` keeps best eligible signal per window; others downgraded |

### `ComputedSignal` (key fields)

- `pair`, `tf`, `direction` (CALL/PUT), `grade`, `score`, `conf`
- `signalType`, `signalReason`, `tradeEligible`
- `entryTime`, `expTime`, `expMin`, `price`
- `adx`, `atr`, `rsi`, `stoch`, `cci`, `bb`, `macdH`, `emaWmaBias`
- `marketStructure`, `candleBodyRatio`, `candleStrengthText`
- `signalUid`, `mode`, `liveRank`

---

## 10. Database Schema

Run `supabase/schema.sql` then `supabase/rls.sql` in Supabase SQL Editor.

### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | References `auth.users` |
| `full_name` | text | |
| `email` | text | |
| `role` | text | `user` \| `admin` |
| `plan` | text | Default `free` |
| `risk_disclaimer_accepted` | boolean | **Required for scan** |
| `disclaimer_accepted_at` | timestamptz | |

### `user_settings`

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid unique | |
| `default_mode` | text | `practice` \| `live` |
| `default_timeframe` | text | `5min` default |
| `default_min_score` | int | Default 5 |
| `show_b_signals` | boolean | |
| `auto_refresh_seconds` | int | |

### `signals`

Stores full computed signal per scan (metrics + `raw_payload` jsonb). Unique on `(user_id, signal_uid)`.

### `trade_journal`

Journal row linked to signal. Key fields:

- Signal metadata (pair, direction, grade, type, entry price/time)
- `olymp_opening_quote`, `olymp_closing_quote`, `olymp_trade_id`
- `result`: Pending \| Win \| Loss \| Refund
- `entry_drift`, `entry_status`, `loss_reason`

### `usage_logs`

Tracks scans and API usage metadata.

### `subscriptions`

Placeholder for future billing.

### `audit_logs`

Placeholder for admin audit trail.

### `market_cache`

Shared OHLC cache (see Market Data Layer).

### Signup trigger

`handle_new_user()` on `auth.users` INSERT → creates `profiles` + `user_settings`.

---

## 11. Row Level Security

Defined in `supabase/rls.sql`.

| Table | Policy summary |
|-------|----------------|
| `profiles` | Select/update own; insert own (`auth.uid() = id`) |
| `user_settings` | Select/insert/update own |
| `signals` | Select/insert/update own |
| `trade_journal` | Select/insert/update own |
| `usage_logs` | Select/insert own |
| `subscriptions` | Select own |
| `audit_logs` | Admin read only |
| `market_cache` | Authenticated read |

`is_admin()` security definer function checks `profiles.role = 'admin'`.

**Server bypass:** Route handlers use `createAdminClient()` (service role) where RLS blocks necessary bootstrap operations (profile upsert on settings save, disclaimer check on scan).

---

## 12. Pages & UI

### Route map

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Landing, hero, disclaimer, CTA |
| `/login` | Client | Login / Sign up tabs |
| `/dashboard` | Server + Client | V4 scanner (main app) |
| `/journal` | Server + Client | Trade journal table |
| `/analytics` | Server + Client | Win rate & stats |
| `/settings` | Server + Client | Profile & defaults |
| `/admin` | Server + Client | Admin usage dashboard |

### Layout components

```
ProtectedShell (server)
  └── AppShell (client)
        ├── Sidebar (nav links)
        └── app-main
              ├── Topbar (time, LIVE/OFFLINE, logout)
              └── page content
```

### Responsive sidebar

| Breakpoint | Behavior |
|------------|----------|
| > 1100px | Full sidebar (220px), full labels |
| 769px – 1100px | Compact sidebar (118px), full labels |
| ≤ 768px | Hidden drawer; ☰ button; backdrop to close |

### Dashboard components

| Component | HTML origin | Role |
|-----------|-------------|------|
| `Topbar` | `.hdr` | Brand, clock, live status, logout |
| `DataProviderStatus` | `.key-box` | Twelve Data connection status |
| `MarketTicker` | `.ticker` | Scrolling pair prices |
| `ScannerControls` | `.ctrl` | Asset, TF, mode, scan button |
| `SessionPills` | `.sessions` | London / NY / Asian filters |
| `StatsRow` | `.stats` | Post-scan summary stats |
| `LoadingScanner` | `.ldr` | Scan progress overlay |
| `SignalCard` | `.sc` | Individual signal display |
| `SupportPanel` | `.support-panel` | Helper content when signals exist |

### Styling

- `app/globals.css` contains ~20k+ characters ported from original HTML template
- CSS variables: `--blue`, `--bull`, `--bear`, `--p1`, `--mono`, etc.
- Dark trading-terminal aesthetic preserved for ~90–95% visual fidelity

---

## 13. Journal & Analytics Logic

### Entry drift (`lib/journal/entryDrift.ts`)

Compares signal entry price vs broker (Olymp) opening quote → **Valid Entry**, **Risky Entry**, or **Invalid Entry**.

### Result calculator (`lib/journal/resultCalculator.ts`)

Given direction CALL/PUT and open/close quotes:

- Price moved in favor → **Win**
- Against → **Loss**
- Tie → **Refund**

### Real win rate (`lib/analytics/winRate.ts`)

Only counts trades where `isRealTradeSignal(signal_type, grade)` is true (excludes pure WATCH ONLY / observation grades per rules).

### Analytics summary (`lib/analytics/summary.ts`)

Builds:

- Total signals, completed, wins, losses, refunds, pending
- Real win rate vs observation accuracy
- Invalid entry count
- Loss reason breakdown
- Best pairs (`pairStats.ts`)

### Export

- `GET /api/export/csv` → `journalToCsv()`
- `GET /api/export/json` → `journalToJson()`

---

## 14. User Journeys

### New user (happy path)

1. Visit `/` → Sign up on `/login`
2. Confirm email → `/auth/callback` → `/dashboard`
3. `/settings` → check risk disclaimer → Save Settings
4. `/dashboard` → configure scanner → **Scan Market**
5. Review signals → `/journal` → enter broker quotes
6. `/analytics` → review performance

### Returning user

1. Login → dashboard
2. Optional: change defaults in settings
3. Scan → journal updates automatically for new signals

### Admin

1. Set `profiles.role = 'admin'` in Supabase SQL
2. Access `/admin` for usage metrics

---

## 15. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Invalid login credentials | Wrong password or unconfirmed email | Confirm user in Supabase; reset password |
| Email link → localhost refused | Site URL = localhost in Supabase | Set Site URL to Vercel domain; add redirect URLs |
| Settings saved but scan says accept disclaimer | Profile row missing or RLS read failed | Run fix migrations; redeploy latest code; save settings again |
| RLS error on profiles | Missing insert policy | Run `20260531_profiles_rls_insert.sql` |
| 503 on `/api/market/ticker` | Twelve Data credits exhausted | Wait for daily reset or new API key |
| Settings 500 service role | `SUPABASE_SERVICE_ROLE_KEY` missing on Vercel | Add env var and redeploy |
| Empty email on settings | Profile row empty | Fixed: email from `auth.user.email` |
| Sidebar cut off on medium width | Old compact CSS | Latest deploy uses 118px full labels |

### Manual disclaimer fix (SQL)

```sql
UPDATE public.profiles
SET risk_disclaimer_accepted = true,
    disclaimer_accepted_at = now()
WHERE email = 'your@email.com';
```

### Make user admin

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 16. Security Model

| Asset | Exposure |
|-------|----------|
| Supabase anon key | Browser (OK with RLS) |
| Service role key | Server only |
| Twelve Data API key | Server only |
| User data | Isolated by `user_id` + RLS |
| Admin routes | Middleware + `role = admin` |

API routes do not trust client-sent user IDs; they use `auth.user.id` from session.

---

## 17. Deployment Checklist

### Vercel

1. Connect GitHub repo `aj-academy/Investing-League`
2. Root directory: repository root (Next.js app)
3. Environment variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TWELVE_DATA_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy from `main` branch

### Supabase

1. Run `supabase/schema.sql`
2. Run `supabase/rls.sql`
3. Run migrations in `supabase/migrations/` if needed
4. **Authentication → URL configuration:**
   - Site URL: `https://investing-league-seven.vercel.app`
   - Redirect URLs: `https://investing-league-seven.vercel.app/**`, `http://localhost:3000/**`
5. **Authentication → Providers → Email:** configure confirm email on/off
6. Create admin user via SQL if needed

### Twelve Data

1. Create API key at twelvedata.com
2. Monitor daily credit usage on free tier

---

## 18. Development Commands

```bash
# Install dependencies
npm install

# Local dev server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Run production server locally
npm run start

# Lint
npm run lint
```

### Local setup

1. `cp .env.example .env.local` and fill values
2. Run Supabase SQL scripts in cloud project
3. `npm run dev`

---

## 19. Visual Migration Map

| Original HTML class | React component |
|---------------------|-----------------|
| `.hdr` | `Topbar.tsx` |
| `.brand` | Brand block in Topbar / Sidebar |
| `.key-box` | `DataProviderStatus.tsx` |
| `.ticker` | `MarketTicker.tsx` |
| `.ctrl` | `ScannerControls.tsx` |
| `.sessions` | `SessionPills.tsx` |
| `.stats` | `StatsRow.tsx` |
| `.ldr` | `LoadingScanner.tsx` |
| `.sg` | Signal grid in `DashboardClient.tsx` |
| `.sc` | `SignalCard.tsx` |
| `.support-panel` | `SupportPanel.tsx` |
| `.journal-box` | Journal page components |
| `.auth-wrap` | Login page |

---

## 20. Migrations & SQL

| File | When to run |
|------|-------------|
| `supabase/schema.sql` | Initial project setup |
| `supabase/rls.sql` | After schema |
| `20260530_auth_trigger_disclaimer.sql` | Update signup trigger for disclaimer metadata |
| `20260530_fix_missing_profiles.sql` | Backfill profiles/settings for existing auth users |
| `20260531_profiles_rls_insert.sql` | Fix profiles INSERT RLS for upsert |

Run in **Supabase → SQL Editor** if production database was created before these files existed.

---

## 21. Historical Notes

### Removed: Demo mode

Previously included:

- `sample@gmail.com` / `12345678` demo login
- Cookie `til_demo_auth`
- Mock journal and synthetic candles
- `/api/auth/demo/login` and `logout`

**Removed** — production uses Supabase authentication only.

### Known platform constraints

- Educational positioning only (no guaranteed profit language)
- Twelve Data free tier limits scan frequency in production
- `subscriptions` table is placeholder for future Stripe/billing integration

---

## Quick Reference: Mental Model

**The Investing League Decision Lab** is a Next.js full-stack app wrapping a **pure TypeScript V4 signal engine** and a **Supabase-backed trade journal**. The browser never calls Twelve Data; scans fetch cached OHLC server-side, classify setups, persist signals and journal rows per user under RLS, and analytics compute win rates with strict eligibility rules. Auth and disclaimer state live in `profiles`; critical paths use the service role where RLS caused production save/read mismatches. The UI preserves the original dark trading-terminal HTML template design.

---

*Last updated: May 2026 — matches commit history through scan disclaimer fix and responsive sidebar.*
