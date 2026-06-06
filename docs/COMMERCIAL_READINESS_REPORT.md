# Commercial Readiness Report — The Investing League Decision Lab

**Generated:** June 2026  
**App:** The Investing League Decision Lab  
**Production:** https://investing-league-seven.vercel.app  
**Repository:** https://github.com/aj-academy/Investing-League

This report is based on the actual codebase (`lib/billing/planLimits.ts`, `lib/signal-engine/v8/`, `app/api/signals/scan/route.ts`, Twelve Data integration, and admin tooling). It covers market data, signals, “best combo,” API costs, subscription pricing, and what you still need for a commercial launch.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Data — How It Works](#2-market-data--how-it-works)
3. [Signals Engine (V8) — What It Does](#3-signals-engine-v8--what-it-does)
4. [“Best Combo” — What It Means in Your App](#4-best-combo--what-it-means-in-your-app)
5. [Current Plan Structure (in code)](#5-current-plan-structure-in-code)
6. [Cost Modeling — What Each User Costs You](#6-cost-modeling--what-each-user-costs-you)
7. [Recommended Subscription Pricing](#7-recommended-subscription-pricing)
8. [What You Must Add for Commercial Launch](#8-what-you-must-add-for-commercial-launch)
9. [Revenue Scenarios (illustrative)](#9-revenue-scenarios-illustrative)
10. [Recommended Launch Roadmap](#10-recommended-launch-roadmap)
11. [Bottom Line](#11-bottom-line)

---

## 1. Executive Summary

**What you have today:** A working educational FX scanner SaaS with a mature **V8 signal engine**, trade journal, analytics, terms/compliance gating, and a full admin panel. Plans exist in code but **billing is not implemented** — admins assign plans manually; the UI says *“Subscription billing coming soon.”*

**Core commercial risk:** Your **free tier allows 999 scans/day** on all 8 pairs with both timeframes — that undermines paid tiers and burns Twelve Data API credits fast.

**Biggest external cost:** **Twelve Data** market data API. For commercial use you likely need their **Business** plan, not the free Individual tier.

**Realistic positioning:** Educational decision-support + journaling for binary/short-expiry FX traders — **not** an auto-trading bot or profit guarantee tool.

---

## 2. Market Data — How It Works

### Provider (single vendor)

| Item | Detail |
|------|--------|
| **Provider** | [Twelve Data](https://twelvedata.com) only |
| **API key** | `TWELVE_DATA_API_KEY` (server-only, never exposed to browser) |
| **Endpoints used** | `/time_series` (OHLC candles), `/price` (live quote) |
| **Pairs** | 8 FX majors: EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, NZD/USD, EUR/GBP |
| **Timeframes** | 5min and 15min expiry |

**Key files:**
- `lib/market/twelveData.ts` — API client
- `lib/market/cachedCandles.ts` — three-tier cache
- `lib/market/candleCache.ts` — in-memory TTL
- `lib/market/tickerService.ts` — live quote polling by plan
- `lib/market/providerErrors.ts` — masks provider errors for non-admins

### Caching (your main cost control)

Three layers reduce API calls:

1. **In-memory cache** — 75s (5min TF), 180s (15min TF)
2. **Supabase `market_cache` table** — same TTL
3. **Twelve Data API** — only on cache miss

### API calls per scan

Each scan loops: **pairs × timeframes → fetch 150 candles → run V8 engine**

| Scan scenario | Max candle API calls (cold cache) | Live quote calls |
|---------------|-----------------------------------|------------------|
| Starter (4 pairs, 1 TF) | **4** | up to 4 |
| Pro (8 pairs, 1 TF) | **8** | up to 8 |
| Pro (8 pairs, both TFs) | **16** | up to 8 |
| Free (8 pairs, both TFs) | **16** | **0** (cached close only) |

With a warm cache, actual `provider_calls` can be **0** — the admin panel tracks this in `scan_sessions` and `usage_logs`.

### Market API routes

| Route | Purpose | Provider calls |
|-------|---------|----------------|
| `POST /api/signals/scan` | Full scan (primary) | Candles per pair×TF + optional ticker |
| `GET/POST /api/market/ticker` | Standalone ticker | Up to 1 `/price` per pair (plan-gated) |
| `POST /api/market/candles` | Direct candle fetch | 0 or 1 `/time_series` per request |
| `GET /api/market/status` | Config check only | **0** (no external call) |

### Live ticker behavior by plan

| Plan | Mode | Quote behavior |
|------|------|----------------|
| **free** | `cached_only` | Last cached 5min candle close only — **no `/price` calls** |
| **starter** | `quote_polling` | `/price` every **180s** per pair (in-memory cache) |
| **pro** | `quote_polling` | `/price` every **60s** per pair |
| **admin** | `full` | `/price` every **30s** per pair |

### Twelve Data pricing (important for commercial)

| Tier | Cost | Limits | Commercial use? |
|------|------|--------|-----------------|
| **Basic (Free)** | $0 | ~**800 API credits/day** (resets midnight UTC) | ❌ Not for commercial SaaS |
| **Grow** | ~$79/mo | ~610 API credits/minute, no daily cap | Individual/non-commercial |
| **Pro** | ~$229/mo | ~1,597 API credits/minute | Individual/non-commercial |
| **Business Venture** | ~$499/mo | Commercial display rights | ✅ For SaaS |
| **Business Enterprise** | ~$1,099/mo | Higher volume | ✅ For larger user base |

**Critical:** Twelve Data separates **Individual** (personal/non-commercial) and **Business** (commercial/external) plans. If you charge subscriptions and show live prices to users, you should use a **Business plan** and confirm display/redistribution rights in their terms.

Sources:
- https://twelvedata.com/pricing
- https://twelvedata.com/pricing-business
- https://support.twelvedata.com/en/articles/5615854-credits

### Other API keys / infrastructure

| Service | Env variable | Role | Approx. cost |
|---------|--------------|------|--------------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auth, DB, cache, journal, admin | Free tier → ~$25/mo Pro as you scale |
| **Vercel** | (hosting) | Next.js app | Free → ~$20/mo Pro |
| **Stripe** | Not integrated yet | Payments | 2.9% + $0.30 per transaction |

**No other paid APIs** in the codebase today (no Stripe, SendGrid, economic calendar, etc.).

### Usage telemetry (already built)

- `scan_sessions`: `provider_calls`, `cache_hits`, `estimated_provider_calls`, `plan_at_scan`
- `usage_logs`: action `scan_market` with metadata (pairs, timeframes, errors)
- Admin views: `app/api/admin/usage/route.ts`, `lib/billing/scanMetrics.ts`

---

## 3. Signals Engine (V8) — What It Does

The V8 engine (`lib/signal-engine/v8/`) is the core product. It is ported from the original HTML “universal_v8” template.

**Key files:**
- `lib/signal-engine/v8/compute.ts` — core scoring
- `lib/signal-engine/v8/config.ts` — thresholds
- `lib/signal-engine/v8/historyMode.ts` — cooldowns, daily limits, live best-signal selector
- `lib/signal-engine/v8/rank.ts` — signal sort order
- `lib/signal-engine/v8/news.ts` — hardcoded UTC news-risk windows
- `lib/signal-engine/v8/patterns.ts` — candle pattern detection
- `lib/signal-engine/index.ts` — entry point

### Scan flow (`POST /api/signals/scan`)

1. Auth + terms check (`hasAcceptedLatestTerms`)
2. Daily scan quota (`canScanToday`)
3. Plan validation (pairs, timeframes, per-user asset access)
4. Create `scan_sessions` row
5. Load last 500 journal rows for V8 history
6. **Loop:** `pairs × timeframes` → `getCandlesCached(pair, tf, 150)` → `computeSignal()`
7. `finalizeScanSignals()` (cooldown, daily limit, live selector, news block)
8. `filterSignals()` (grade, session filter)
9. Upsert `signals` + `trade_journal` (service role)
10. Log `usage_logs`, update session metrics, build ticker

### Inputs per signal

- **150 OHLC candles** per pair/timeframe (minimum 90 required)
- User **journal history** (last 500 rows) for cooldowns and daily limits
- **Session filter** (London, New York, overlap, or any)
- **News-risk windows** (hardcoded UTC blocks in `news.ts`)

### Indicators & logic

Multi-factor confluence scoring using:

- EMA / WMA trends
- RSI, MACD, Stochastic
- ADX (trend strength)
- ATR (volatility filter)
- Candle patterns
- Spread/ATR minimums (different for JPY pairs)
- Score gap thresholds: **6** (5min), **4** (15min)

### V8 key numbers (`lib/signal-engine/v8/config.ts`)

| Constant | Value |
|----------|-------|
| Score gap (5min) | **6** |
| Score gap (15min) | **4** |
| Cooldown after final (5min) | **10 min** |
| Cooldown after final (15min) | **30 min** |
| Default daily trade limit | **5** (UI: 3/5/8/999) |
| Min candles required | **90** bars |
| Candles fetched per pair/TF | **150** |

### Signal grades

| Grade | Criteria (approx.) |
|-------|-------------------|
| **A+** | Confidence ≥ 78%, score ≥ 72 |
| **A** | High confluence |
| **B** | Moderate |
| **C** | Weak / observe only |

### Signal types (what users see)

| Type | Meaning |
|------|---------|
| **STRONG FINAL** | Highest conviction — trade eligible |
| **FINAL TRADE** | Trade eligible |
| **WATCH ONLY** | Observe, don’t trade |
| **REPEATED SIGNAL** | Same setup recently — cooldown |
| **DAILY LIMIT** | User hit daily trade cap |
| **NEWS CAUTION** | Blocked during news window |
| **CORRELATION RISK** | Downgraded in Live mode (USD-linked pairs) |

### Permission box

Every signal gets: **TRADE ALLOWED** | **OBSERVE ONLY** | **DO NOT TRADE**

### Practice vs Live mode

| Mode | Behavior |
|------|----------|
| **Practice** | Shows all filtered signals — good for learning and analytics |
| **Live** | Picks **one best signal** per scan; others downgraded to OBSERVE ONLY / CORRELATION RISK |

Live-mode ranking (`lib/signal-engine/v8/rank.ts`):

`STRONG FINAL` > `FINAL TRADE` > observe types → then by confidence → score gap → score

### Scanner UI controls (`components/dashboard/ScannerControls.tsx`)

- Mode: **Practice** vs **Live**
- Expiry: 5min / 15min / both
- Min grade: B / A / A+
- Session filter: any, london, newyork, overlap
- Daily trade limit: 3, 5, 8, 999
- Auto refresh: 60s / 2min / 5min / manual (each refresh = full scan, counts toward daily limit)

### Session gating (`lib/signal-engine/session.ts`)

Blocks scans on weekend thin FX (Sat all day, Fri 21:00+ UTC, Sun before 22:00 UTC).

### Supported pairs

`EUR/USD`, `GBP/USD`, `USD/JPY`, `USD/CHF`, `AUD/USD`, `USD/CAD`, `NZD/USD`, `EUR/GBP`

---

## 4. “Best Combo” — What It Means in Your App

There is **no “best combo” feature** in the codebase (no matches for `combo`, `bestCombo`, or `BEST_COMBO`).

### A) Live mode “best signal”

In **Live** mode, the engine selects the **single highest-ranked tradeable signal** across all scanned pairs/timeframes for that scan window. This is the closest thing to a “best pick right now.”

**File:** `lib/signal-engine/v8/historyMode.ts`

### B) Analytics “best pair / timeframe / grade”

From journal data (`lib/analytics/summary.ts`), analytics computes:

- **Best pair** — highest win rate by currency pair
- **Best timeframe** — 5min vs 15min performance
- **Best grade** — A+ vs A vs B performance
- **Best signal type** — STRONG FINAL vs FINAL TRADE, etc.

This is **per-user historical performance**, not a universal market recommendation.

**Files:** `lib/analytics/summary.ts`, `components/analytics/AnalyticsView.tsx`

### C) Practical “combo” for binary FX traders

Based on engine design and typical FX behavior:

| Combo | Why it tends to work well |
|-------|---------------------------|
| **EUR/USD + 5min** | Highest liquidity, tight spreads, clean technicals |
| **GBP/USD + 15min** | Strong moves, good for higher-expiry setups |
| **USD/JPY + 5min** | Volatile sessions (Tokyo/London overlap) |
| **EUR/GBP + 15min** | Lower USD correlation — useful in Live mode |

### Recommendation for commercial product

Add an explicit **“Recommended Combos”** section on the dashboard (pair + timeframe + session) based on aggregate anonymized journal stats across users — this would be a strong differentiator and does not exist yet.

---

## 5. Current Plan Structure (in code)

Defined in `lib/billing/planLimits.ts`:

| Plan | Pairs | Timeframes | Both TFs | Daily scans | Live quotes |
|------|-------|------------|----------|-------------|-------------|
| **Free** | 8 (all) | 5min, 15min | ✅ | **999** ⚠️ | Cached only |
| **Starter** | 4 | 5min, 15min | ❌ | 30 | Every 180s |
| **Pro** | 8 (all) | 5min, 15min, both | ✅ | 100 | Every 60s |
| **Admin** | 8 | All | ✅ | 9,999 | Every 30s |

### Plan assignment today

- Stored on `profiles.plan` (`supabase/schema.sql`)
- `role === 'admin'` → effective **admin** plan regardless of `plan` field
- **No Stripe, no checkout, no plan prices** in codebase
- Upgrade CTA: `"Subscription billing coming soon."` → `/settings` (`components/dashboard/PlanUsageCard.tsx`)
- `subscriptions` table exists as **placeholder** — unused

### Per-user asset overrides

- `user_asset_access` table + `lib/access/assetAccess.ts`
- Admin can restrict pairs per user beyond plan defaults (`app/api/admin/assets/route.ts`)

### Scan quota enforcement

- `lib/billing/scanUsage.ts` → `canScanToday()` counts `scan_sessions` created since **UTC midnight**
- Blocked with HTTP **429**, code `DAILY_SCAN_LIMIT`
- Auto-refresh pauses when limit hit

**Problem:** Free tier is more generous than Pro in scan count. For commercial launch, free should be a **trial/lead magnet**, not a full product.

---

## 6. Cost Modeling — What Each User Costs You

### Worst case (no cache, auto-refresh every 60s, Pro user)

- 100 scans/day × 16 candle calls = **1,600 API calls/day per heavy user**
- Free tier Twelve Data cap = **800/day total** → one heavy user breaks the free API key

### Realistic case (with cache)

- Cache hit rate often 50–80% after warm-up
- Starter user (30 scans, 4 pairs, 1 TF): ~60–120 API calls/day
- Pro user (100 scans, 8 pairs, both TFs): ~800–1,600 API calls/day

### Break-even math (rough)

| Your infra cost (monthly) | Users needed at $29/mo | At $49/mo | At $79/mo |
|---------------------------|------------------------|-----------|-----------|
| ~$500 (TD Business + Supabase + Vercel) | 18 users | 11 users | 7 users |
| ~$800 | 28 users | 17 users | 11 users |
| ~$1,200 | 42 users | 25 users | 16 users |

These are simplified — real margin depends on scan behavior, cache efficiency, and how many free users you allow.

---

## 7. Recommended Subscription Pricing

**Positioning:** Educational FX decision lab — scanner + journal + analytics. Comparable tools (TradingView indicators, signal groups, journaling apps) often charge **$25–$99/month**.

### Suggested tiers (USD)

| Tier | Price | Target user | Suggested limits (tune in code) |
|------|-------|-------------|-----------------------------------|
| **Free / Trial** | $0 (14-day trial or forever-limited) | Lead gen | 5 scans/day, 2 pairs, 5min only, Practice mode only, no export |
| **Starter** | **$19–29/mo** | Beginner binary traders | 30 scans/day, 4 pairs, 1 TF, live quotes 180s |
| **Pro** | **$49–79/mo** | Active traders | 100 scans/day, all 8 pairs, both TFs, live quotes 60s, export |
| **Elite / Team** | **$99–149/mo** | Power users / small groups | 200 scans/day, priority support, advanced analytics |

### Annual pricing

Offer **~20% off** annual (e.g. Pro $59/mo → **$566/year**). Improves cash flow and reduces churn.

### India / emerging markets (optional)

If your audience is India-heavy, consider:

- **Starter ₹999–1,499/mo** (~$12–18)
- **Pro ₹2,499–3,999/mo** (~$30–48)

Use Stripe regional pricing or Razorpay for INR.

### Recommended code changes before launch

```typescript
// lib/billing/planLimits.ts — recommended commercial limits
free: {
  dailyScanLimit: 5,          // was 999
  maxPairsPerScan: 2,         // was 8
  allowBothTimeframes: false, // was true
  allowAutoScan: false,       // manual only on free
}
```

---

## 8. What You Must Add for Commercial Launch

### Already shipped (strengths)

| Area | Features |
|------|----------|
| **Auth** | Supabase email/password, signup disclaimer, account suspension, admin unlock |
| **Scanner** | V8 engine, pair selection, plan gating, auto-refresh, sound alerts, session filters |
| **Journal** | Auto-save on scan, broker fields, entry drift, Win/Loss/Refund |
| **Analytics** | Win rate, best/worst pair, loss reasons, entry drift buckets |
| **Admin** | Overview, user CRUD, plan/role/suspend, per-user asset access, terms mgmt, per-user T&C acceptance table, user reports, API usage stats, audit logs |
| **Compliance** | Terms documents + acceptance gating before scan |
| **Export** | CSV/JSON journal export |
| **Pages** | `/`, `/login`, `/dashboard`, `/journal`, `/analytics`, `/settings`, `/admin`, `/terms`, `/account-suspended` |

### Critical (must-have)

| # | Feature | Why |
|---|---------|-----|
| 1 | **Stripe (or Razorpay) billing** | Self-serve subscribe, upgrade, cancel |
| 2 | **Pricing page** | Public tiers, feature comparison, FAQ |
| 3 | **Webhook handler** | `checkout.session.completed`, `invoice.paid`, `subscription.deleted` → update `profiles.plan` |
| 4 | **Tighten free tier** | 999 scans/day kills monetization and API budget |
| 5 | **Twelve Data Business plan** | Legal/commercial display rights |
| 6 | **Terms of Service + Privacy Policy** | Subscription, refunds, data use, disclaimers |
| 7 | **Refund policy** | e.g. 7-day money-back |
| 8 | **Email notifications** | Welcome, payment receipt, failed payment, trial ending (Resend/SendGrid) |

### Important (should-have)

| # | Feature | Why |
|---|---------|-----|
| 9 | **Self-serve signup** | Today admins create users manually |
| 10 | **Password reset / email verify** | Standard SaaS expectation |
| 11 | **Usage-based alerts** | Email admin when API credits near limit |
| 12 | **Invoice history page** | Stripe Customer Portal |
| 13 | **Onboarding flow** | Disclaimer → terms → first scan tutorial |
| 14 | **Landing page with social proof** | Win-rate disclaimers, testimonials, demo video |
| 15 | **Recommended combos feature** | Product differentiator (see §4) |

### Nice-to-have (growth)

| # | Feature | Why |
|---|---------|-----|
| 16 | **Affiliate / referral program** | Trading communities spread via word of mouth |
| 17 | **Telegram / Discord alerts** | Pro tier perk for signal notifications |
| 18 | **Economic calendar API** | Replace hardcoded news windows |
| 19 | **Second data provider failover** | Reduce single-vendor risk |
| 20 | **Mobile-responsive PWA** | Traders on phone |
| 21 | **Team / org accounts** | B2B (academies, signal groups) |
| 22 | **API access for integrators** | Higher-tier revenue |
| 23 | **SLA + status page** | Trust for paying users |
| 24 | **GDPR / data export / delete** | EU users, compliance |

### Legal & compliance (non-negotiable for commercial)

| Item | Status in app | Action |
|------|---------------|--------|
| Risk disclaimer | ✅ Signup + settings | Keep prominent on every scan page |
| Terms & Conditions | ✅ Versioned + acceptance tracking | Add subscription-specific clauses |
| “Educational only” positioning | ✅ In docs | Repeat on pricing page and marketing |
| No profit guarantees | ✅ | Required in ToS and ads |
| Financial regulations | ⚠️ | You provide **signals/analysis**, not brokerage — avoid “investment advice” language in regulated jurisdictions |
| Data licensing | ⚠️ | Confirm Twelve Data Business allows your use case |
| Cookie consent | ❌ | Add if EU traffic |
| PCI compliance | N/A | Stripe handles card data |

### Known gaps / inconsistencies

| Gap | Detail |
|-----|--------|
| **No payment integration** | No Stripe/webhooks; plans assigned manually by admin |
| **No pricing page** | No dollar amounts anywhere in code |
| **Free tier too generous** | 999 scans/day undermines monetization |
| **Single data vendor** | Twelve Data only; no failover |
| **No per-org/team billing** | Single-user accounts only |
| **No email lifecycle** | No transactional email, dunning, receipts |
| **Hardcoded news windows** | Not configurable; no real economic calendar API |
| **Manual ops heavy** | Admin must create users, assign plans, manage assets |
| **Provider cost not tied to billing** | `provider_calls` tracked but not billed to users |
| **Docs drift** | `docs/PROJECT_OVERVIEW.md` still references “V4 engine”; code is V8 |
| **subscriptions table unused** | Schema ready but no integration |
| **Overview terms count** | `app/api/admin/overview/route.ts` may count `risk_disclaimer_accepted` instead of `user_terms_acceptance` |

---

## 9. Revenue Scenarios (illustrative)

| Monthly paying users | Mix (60% Starter @ $29, 40% Pro @ $59) | Gross MRR | After ~15% fees/churn buffer |
|----------------------|------------------------------------------|-----------|------------------------------|
| 50 | 30 Starter + 20 Pro | **~$2,050** | ~$1,740 |
| 100 | 60 + 40 | **~$4,100** | ~$3,485 |
| 250 | 150 + 100 | **~$10,250** | ~$8,700 |
| 500 | 300 + 200 | **~$20,500** | ~$17,400 |

At ~100 paying users with disciplined free tier and caching, you can likely cover **Twelve Data Business (~$499/mo)** + Supabase + Vercel and reach modest profit.

---

## 10. Recommended Launch Roadmap

```
Phase 1 (2–3 weeks)
├── Fix free tier limits in planLimits.ts
├── Stripe checkout + webhook → profiles.plan
├── Public pricing page
└── ToS + Privacy Policy + refund policy

Phase 2 (2 weeks)
├── Email lifecycle (welcome, receipt, dunning)
├── Stripe Customer Portal (invoices, cancel)
├── Self-serve signup (reduce admin manual work)
└── Twelve Data Business plan upgrade

Phase 3 (ongoing)
├── Recommended combos dashboard feature
├── Telegram/Discord alert integration (Pro perk)
├── Economic calendar API (replace hardcoded news)
└── Marketing, affiliates, demo content
```

---

## 11. Bottom Line

| Question | Answer |
|----------|--------|
| **Is the product commercially viable?** | Yes — V8 engine, journal, analytics, and admin tooling are solid |
| **Main cost driver?** | Twelve Data API (~$499+/mo Business for commercial) |
| **What to charge?** | Starter **$19–29/mo**, Pro **$49–79/mo**, annual discount |
| **Biggest gap?** | No payment integration; free tier too generous; manual user provisioning |
| **“Best combo”?** | Not a product feature yet — implement as pair+timeframe+session recommendations from analytics |

**Highest-impact next steps:**

1. Fix free tier limits
2. Stripe + pricing page
3. Twelve Data Business upgrade
4. Legal pages (ToS, Privacy, refunds)

---

## Appendix: Key File Reference

| Topic | Path |
|-------|------|
| Plan limits | `lib/billing/planLimits.ts` |
| Scan quota | `lib/billing/scanUsage.ts` |
| Scan metrics | `lib/billing/scanMetrics.ts` |
| Scan route | `app/api/signals/scan/route.ts` |
| Twelve Data client | `lib/market/twelveData.ts` |
| Candle cache | `lib/market/cachedCandles.ts` |
| Provider errors | `lib/market/providerErrors.ts` |
| V8 config | `lib/signal-engine/v8/config.ts` |
| V8 compute | `lib/signal-engine/v8/compute.ts` |
| Live best signal | `lib/signal-engine/v8/historyMode.ts` |
| Analytics summary | `lib/analytics/summary.ts` |
| Terms gating | `lib/terms/terms.ts` |
| Admin panel | `components/admin/AdminView.tsx` |
| Plan usage UI | `components/dashboard/PlanUsageCard.tsx` |
| DB schema | `supabase/schema.sql` |
| Project docs | `docs/PROJECT_OVERVIEW.md` |

---

*This document is for internal planning. Pricing and third-party costs should be verified against current vendor pages before launch.*
