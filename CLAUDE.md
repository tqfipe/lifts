# Lifts — repo rules

This is a PUBLIC repository (github.com/tqfipe/lifts). The app is local-first:
all user data lives in the browser; nothing personal belongs in git.

## Privacy rules (hard requirements)

- NEVER commit personal workout data in any form: exported backups
  (`workouts-*.json`), import files, converted notes, or the owner's training
  history embedded in code, tests, fixtures, or documentation. Test fixtures
  must use obviously synthetic data.
- NEVER commit screenshots or recordings that show real training data. README
  screenshots must be generated from synthetic demo data only.
- NEVER commit `docs/` (specs, plans, working documents — also an owner-wide
  rule), `.superpowers/`, `.playwright-mcp/`, `.env*`, tokens, or credentials.
- Before any commit that used `git add -A` or `git add .`, review
  `git status` for unexpected files. Prefer adding paths explicitly.
- Commits are public the moment they're pushed; when in doubt about a file,
  ask the owner before committing it.

## Project conventions

- Svelte 5 runes only (`$state`/`$derived`/`$props`/`$effect`, `onclick=`).
- Weights are stored canonically in kg; lb is a display-side conversion only
  (`toDisplay`/`fromDisplay` in `src/lib/weight.ts`).
- Colors come from the theme tokens in `src/app.css` (`--accent-rgb` + theme
  blocks); no hard-coded accent colors in components.
- Pure logic lives in `src/lib/*.ts` with colocated Vitest tests; run
  `npm test && npm run check && npm run build` before every commit.
- Pushes to `main` auto-deploy to GitHub Pages; the service worker applies
  updates on the app's next launch.
