# FPL Fantasy Dashboard

An automated Fantasy Premier League companion: live stats, fixture-difficulty planning, top-manager tips, and personal team tracking — hosted for free on GitHub Pages and kept fresh by a scheduled GitHub Action.

## How it works

- **Data**: an hourly GitHub Action (`.github/workflows/refresh-data.yml`) fetches the official public FPL API, computes derived stats, and commits JSON snapshots to `public/data/`.
- **Top-manager insights**: sourced from the top 50 managers in the official "Overall" league (id 314), aggregated server-side. Throttled to run at most once every ~20 hours.
- **Frontend**: a static React + Vite dashboard that reads the committed JSON. Deployed automatically to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`).
- **My Team**: your own manager ID is stored only in your browser's `localStorage` and fetched live, client-side, from the FPL API — nothing personal is ever committed to the repo.

## One-time repo setup (manual, can't be scripted)

1. **Settings → Actions → General → Workflow permissions** → select "Read and write permissions" (needed so `refresh-data.yml` can commit data).
2. **Settings → Pages → Source** → select "GitHub Actions".
3. Trigger `Refresh FPL Data` once manually (Actions tab → Run workflow) to seed real data — the site ships with empty placeholders until then.

Once both are set, the site is live at `https://uixori-code.github.io/fpl-fantasy-dashboard/` and updates itself hourly.

## Local development

```bash
npm install
npm run fetch:all   # pull real FPL data into public/data/
npm run dev         # http://localhost:5173
```

## Setting your manager ID

Go to the **Settings** page in the dashboard and enter your FPL manager ID (the number in `fantasy.premierleague.com/entry/<ID>/...`, or found via DevTools → Network → `/api/me/` → `entry` field).
