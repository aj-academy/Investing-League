# The Investing League — Primary marketing site

Vite + React public website (courses, contact, scanner preview).

## Features

- **Scanner section** on Home (`#scanner`) — preview + link to Decision Lab
- **Syllabus / enrollment** — forms open WhatsApp (no backend)
- **Decision Lab** nav button → full scanner at `VITE_DECISION_LAB_URL`

## Setup

```bash
cd marketing-site
npm install
cp .env.example .env
npm run dev
```

## Deploy (Vercel)

1. New Vercel project → root directory: `marketing-site`
2. Build: `npm run build` · Output: `dist`
3. Set env: `VITE_DECISION_LAB_URL=https://investing-league-seven.vercel.app`
4. Point your primary domain (e.g. `theinvestingleague.info`) here

Decision Lab stays on its own Vercel project (Next.js root).
