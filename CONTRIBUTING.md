# Contributing to Imperium Romanum

## Architecture

```
src/
  main.jsx                 Entry (createRoot + observability)
  ErrorBoundary.jsx
  RomanGlobe.jsx           Orchestrator: globe state, composition
  components/              Presentational UI (ToastBanner, ModalShell)
  hooks/                   Feature hooks (audio, tour, search, toast, sheets)
  lib/                     Pure helpers (i18n, quiz, styles, projections, hardening)
  data/                    Historical content ESM modules
```

Prefer **ESM imports** over `window` globals. Keep pure logic in `lib/` (unit-tested). Keep React feature state in `hooks/`. Keep content packs in `data/`.

`getTriggerYears` lives in `src/lib/hardening.js` and is re-exported from `src/data/data.js` for content consumers.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
npm test         # vitest unit/content checks
npm run test:e2e # Playwright smoke (after build/preview)
npm run deploy   # build + Surge publish (local; CI uses the same surge pin)
```

## Deploy / CI

- **Production URL:** https://romainvicta.surge.sh/
- **GitHub Actions** (`.github/workflows/deploy.yml`): on PR/push — unit tests, `npm audit --audit-level=high`, build, Playwright e2e; on push to `main` — deploy the built `dist` artifact via `SURGE_TOKEN`.
- **Secret:** repository secret `SURGE_TOKEN` (from `surge token` after `npx surge login`).
- **Rollback:** revert the bad commit on `main` and push (CI redeploys), or download a previous successful Actions `dist` artifact and `npx surge@0.31.1 ./dist romainvicta.surge.sh`.
- **Optional telemetry:** set `VITE_TELEMETRY_URL` at build time to a same-origin or CSP-allowlisted endpoint that accepts `sendBeacon` JSON. Default builds leave it unset (console-only). Also set `VITE_APP_VERSION` (CI uses the git SHA).
- **Env files:** use `.env.local` for local overrides; `.env*` is gitignored (see `.env.example`).

## Adding an event

1. Add an entry to `data.js` (or `src/data/data.js` — keep root and `src/data` in sync via `node scripts/setup-data-modules.mjs` after editing root files).
2. Required fields: `id`, `cat`, `name`, `y1`, `y2`, `desc`, `locs[]`, `paths[]`, `facts[]`.
3. Add Spanish overlays in `data_es.js` keyed by the **same `id`**.
4. **Spanish `locs` are index-aligned** with English `locs` — insert/reorder in both files together.
5. Optional: encyclopedia text in `data_wiki.js` / `data_wiki_es.js`, images in `data_images.js`.

## Tours

Every `eventId` in `data_tours.js` must exist in `DATA`. Unit tests enforce this.

## Security / hosting

- Production builds do not use Babel Standalone or CDN React/Three.
- **CSP** is enforced via a `<meta http-equiv="Content-Security-Policy">` in `index.html` (primary on Surge). `public/_headers` mirrors the same policy for hosts that honor Netlify-style headers (Surge typically does not).
- Allowlist: self scripts/styles, Wikimedia images, self media, `worker-src`/`blob` for Three.js. Do not reintroduce third-party texture hosts.
- If enabling `VITE_TELEMETRY_URL`, extend `connect-src` in both the meta CSP and `_headers` to that origin in the same change.

## Image attribution

Many illustrations are from Wikimedia Commons. Prefer linking/attributing sources when adding new images. See each `imgAlt` and URL host.

## License

All rights reserved for the application shell unless otherwise noted. Wikimedia media remain under their respective licenses.
