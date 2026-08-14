# Lifts

Local-first workout log PWA. All data stays in the browser's IndexedDB on your
device — no accounts, no cloud, no network requests. Backup and restore via
JSON files in Settings.

## Develop

    npm install
    npm run dev

## Test & build

    npm test
    npm run build

## Deploy

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`
(repo Settings → Pages → Source: "GitHub Actions"). Then open the Pages URL on
your phone and "Add to Home Screen".
