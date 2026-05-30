# The Investing League Decision Lab

Educational decision-support and trade journaling SaaS built from the V4 Power Engine HTML template.

## Stack

- Next.js App Router + TypeScript
- Supabase Auth + PostgreSQL + RLS
- Twelve Data (server-side only)
- Vercel deployment ready

## Setup

1. Copy `.env.example` to `.env.local` and fill values.
2. Run `supabase/schema.sql` then `supabase/rls.sql` in your Supabase SQL editor.
3. `npm install`
4. `npm run dev`

## Routes

- `/` — Landing page
- `/login` — Auth
- `/dashboard` — Scanner (template-faithful UI)
- `/journal` — Trade journal
- `/analytics` — Performance analytics
- `/settings` — Profile & scanner defaults
- `/admin` — Admin only

## Disclaimer

This platform is for educational analysis, signal testing, and trade journaling only. It does not guarantee profit and does not provide financial advice.

## Visual Migration Map

| HTML | React |
|------|-------|
| `.hdr` | `Topbar.tsx` |
| `.brand` | Brand block in Topbar |
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
