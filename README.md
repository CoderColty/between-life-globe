# Between — a living portrait of Earth

An interactive Vite + TypeScript / globe.gl artwork of **statistically simulated** births and deaths. No individual records are collected or displayed.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open the Local URL Vite prints (normally http://127.0.0.1:5173). Vite includes the small Node context proxy automatically; no second process, API keys, database, or paid services are needed.

```sh
npm test           # Vitest math and data handling tests
npm run build      # TypeScript check + production client build
npm run preview    # Preview build with context proxy
npm start          # Serve dist plus proxy on http://127.0.0.1:4173
```

Production deployment needs a Node host running `npm start` after `npm run build`, with `public/countries.geojson` retained for the proxy allowlist. Serving dist alone supports the globe and World Bank data, but will not serve `/api/wiki` and `/api/news`. Set `PORT` to change the production port. The provided server binds to loopback for local use; configure a reverse proxy for a hosted deployment.

## What the lights mean

For each country and event type:

`events/second = population × crude annual rate / 1000 / 31,557,600`

Every approximately 100 ms, sample independent Poisson counts using elapsed simulation time. The 1×, 10× (default), and 100× buttons multiply elapsed simulation time. Worldwide rate labels remain **unscaled**. Counters are realized simulated events, not real births/deaths. They include events whose rings are hidden or dropped. Toggles affect rendering only. Hidden tabs pause simulation without backfilling time, and large frame delays are capped at 0.5 seconds.

The exact Poisson sampler sums independent chunks for numerical stability. Points are sampled uniformly by spherical land area via bounding-box rejection, with polygon holes and antimeridian unwrapping. This is **not population-density sampling within countries**: urban/rural differences are not represented. Annual totals govern the difference between countries. A rare exhausted sampling attempt omits only the visible pulse, not its count.

Rings expand and fade over two seconds. At most 300 are submitted to globe.gl; old rings are dropped when the cap is reached. No DOM node is created per pulse. Rendering and simulation are requestAnimationFrame-driven; geometry bounds are prepared once. Device pixel ratio is capped at 1.6. Frame rate depends on device and WebGL support; 60 fps is a target, not a measured guarantee.

## Data and provenance

- **World Bank API:** `https://api.worldbank.org/v2/country/all/indicator/{indicator}?format=json&mrnev=1&per_page=300`. Indicators: SP.POP.TOTL, SP.DYN.CBRT.IN, SP.DYN.CDRT.IN, SP.DYN.LE00.IN. The most recent non-empty values may have different years, all shown in the panel. Only ISO3 codes matching bundled country geometry are retained, excluding aggregates. Browser memory and localStorage cache (24 hours). Missing fields display n/a and missing demographic rates generate no events.
- **Offline snapshot:** `public/world-bank-snapshot.json`, fetched November 21, 2026 (America/New_York). Used when live World Bank requests fail; UI identifies fallback and date. Refresh deliberately with `node scripts/snapshot.mjs`. Real annual source values, never invented fixtures.
- **Borders:** Natural Earth 110m admin-0 countries, public domain. Downloaded from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson. Low-resolution borders omit small states and reflect cartographic conventions, not a position on sovereignty. World totals are sums for covered countries, not a separate World Bank global aggregate.
- **Earth texture:** bundled `public/earth-night.jpg`, from the three-globe example assets: https://github.com/vasturiano/three-globe/blob/master/example/img/earth-night.jpg (NASA-derived night Earth imagery). No runtime CDN scripts or texture requests.
- **Wikipedia:** REST summary endpoint; first three sentences, linked to the article. Text remains subject to Wikipedia's attribution/share-alike terms; it is fetched on demand, not bundled.
- **GDELT DOC 2.0:** country-name phrase, `sourcelang:english`, `timespan=48h`, `sort=datedesc`, `maxrecords=5`. Source/domain and observed time are shown. Headlines may mention a country without describing an event within it. News is not evidence for the simulated lights.

## Proxy and failure handling

Initial browser probes returned Wikipedia JSON but GDELT rate limiting. `proxy.mjs` implements only the two allowlisted context endpoints, validates country names against bundled geometry, coalesces identical in-flight requests, caches successful results for five minutes, spaces GDELT requests by 5.5 seconds, and times out upstream requests. It is not an open URL proxy. Browser context results are cached in memory; failed requests can be retried independently. A proxy cannot guarantee availability or bypass upstream rate limiting. Wikipedia and news can each fail without breaking stats or simulation. No source requires a key.

## Structure

- `src/globe.ts`: globe rendering, hover/click, camera and idle rotation.
- `src/simulation.ts`: pure rate, Poisson and polygon sampling functions.
- `src/data.ts`: typed API responses, caching, source fallbacks, safe links.
- `src/panel.ts`: country statistics and independently loaded context sections.
- `src/main.ts`: application controls, animation loop and pulse cap.
- `src/style.css`: plain responsive CSS, mobile bottom sheet, reduced-motion preferences.
- `proxy.mjs`, `server.mjs`, `vite.config.ts`: cached Node proxy in dev/preview/production.

The country dropdown provides a keyboard alternative to globe picking. Escape or X closes the panel; the data explanation uses a native modal dialog. Auto-rotation pauses during interaction and resumes after five idle seconds, respecting reduced-motion preferences.
## Verification performed

- `npm test`: 13 tests passed (rate math, Poisson moments, holes, islands, dateline, missing data, aggregate exclusion, safe URLs).
- `npm run build`: TypeScript and Vite production build passed. Vite reports a large 3D library bundle (about 538 KB gzipped).
- `npm audit --omit=dev`: no production vulnerabilities reported.
- Browser: globe render and country picking; desktop 1440×900 and narrow mobile layout; 100×/10× switching; birth/death toggles; data modal; close button; France population/rate years and counters; five GDELT articles and a Wikipedia summary.
- Verified independent section error handling during upstream unavailability, followed by successful context retrieval. GDELT remains subject to rate limiting.
- Production Node server loads the built client; no browser console errors observed during the production smoke check.
- Not benchmarked: sustained 60 fps on a mid-range physical laptop, every country's API context, physical touch/pinch gestures, or disconnected-network behavior. Bundled fallback data, borders and texture are present; browser reload still requires the local server.
