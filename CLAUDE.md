# Farmcast

A weather-driven decision tool for Dutch farmers — built as an **immersive, Windy.com-style living map of the Netherlands.** Not a weather app: the product is the *judgment* on top of the data. It takes raw forecast data (soil temperature, soil moisture, wind, rain, evapotranspiration, frost risk) and turns it into farm decisions like "good window to harvest Thu–Sat" or "too windy to spray today" — painted across the whole country and read off a glass panel for any field you pick. The Netherlands is the world's #2 agricultural exporter, so this is a real domain with real users.

This started as a conversation between Ashwin and his dad: build something with the weather, make it useful for Dutch farmers, tell them whether conditions are right for a given crop or harvest. It's Ashwin's **second** web project, and the explicit goal is to beat his first one (Permit Intelligence) on polish and "wow" — so the whole thing is built around an unforgettable hero: a full-screen dark map with animated wind, live rain radar, and country-wide condition overlays.

Built crop-agnostic — a generic engine where any crop's thresholds plug in as config. Web app first, native mobile later.

**Hard constraint: this project must cost $0.** No paid API keys, no backend, no usage fees. Every dependency is free/open-source (see Tech Stack).

---

## Folder Structure

```
farmcast/
├── CLAUDE.md              ← you are here — project context + plan
├── src/
│   ├── components/        ← shared, reusable UI (glass panel, indicators, layout)
│   ├── features/
│   │   ├── dashboard/     ← the floating glass condition panel + advice
│   │   └── map/           ← MapLibre map, overlays, wind layer, rain radar, search
│   ├── lib/               ← API clients (Open-Meteo, RainViewer), grid sampler, rules engine
│   ├── hooks/             ← React hooks (data fetching, geolocation, ⌘K)
│   ├── types/             ← shared TypeScript types (weather data, crop thresholds)
│   └── data/             ← crop threshold definitions (the rules engine config)
├── public/               ← static assets, PWA icons
└── tests/               ← test files
```

---

## Product Vision

A single immersive screen where **the panel is the product, the map is the backdrop.**

The map is a dark, full-bleed MapLibre canvas — a beautiful location picker. The real product is the glass panel that opens when you select a field: live metrics, farm advice, and a 7-day "best window" row that tells a farmer at a glance which days are good to spray or harvest — without reading a number.

- **Full-bleed dark MapLibre map** of the Netherlands.
- **⌘K location search** + click-to-pick + "use my location"; selecting a field flies the camera there and opens the glass panel.
- **Floating glass panel** with live metrics (temp, wind, soil, humidity), a custom wind compass, and a 7-day sparkline.
- **Farm advice strip** inside the panel: spray go/no-go, frost alert, harvest window — glowing green/amber/red indicators, driven by a crop rules engine.
- **"Best window" row** — 7 day columns each with a single go/caution/stop dot for the selected activity. Farmer glances, knows Thursday and Friday are good. No time scrubber needed.
- **Field bookmarks** (localStorage) — save named fields like "Polder Noord", each with a quick status dot. The app becomes *theirs*.
- **Deeplink sharing** (`?lat=52.3&lon=5.1`) — share a field's conditions as a URL, zero backend.
- **Dutch legal spray thresholds** — NL ctgb.nl wind limits per pesticide class, hardcoded as config. Not just "conditions are borderline" but "this is legally off-limits today."
- **PWA push alerts** — service worker notifies when a spray window opens for a saved field. The app comes to you.

Crop logic is **data, not code**: each crop is a threshold config; a generic evaluator scores any forecast against it.

---

## Design Language

- **Theme:** Dark — deep navy/near-black base, frosted-glass panels (backdrop-blur), thin light borders.
- **Accents:** Condition semantics — green (go) / amber (caution) / red (stop), used as glows on indicators and as the heatmap ramp. One cool brand accent (electric cyan/sky) for UI chrome.
- **Typography:** A crisp modern sans (Geist / Inter Tight), strong size/weight hierarchy, tabular numerals for metrics.
- **Motion:** Framer Motion — panel enter/exit, animated counters, layer cross-fades, camera fly-to easing, chart draw-in. Fast and physical, not decorative.
- **Responsive:** Glass panels become bottom sheets on mobile; map stays full-screen. Mobile-considered from day one.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language / build | TypeScript + Vite | Fast, modern, typed |
| Framework | React 18 | Known stack |
| Styling | Tailwind CSS | + CSS vars for theme tokens |
| Components | shadcn/ui | Accessible primitives (dialog/command/sheet) |
| Command palette | shadcn `Command` (cmdk) | The ⌘K search |
| Map | MapLibre GL JS (`react-map-gl`) | Dark vector tiles via **OpenFreeMap/CARTO** — free, no token. Globe projection for intro |
| Overlays | MapLibre heatmap → **deck.gl** (MIT) later | Painted condition heatmaps from sampled grid |
| Wind layer | Open-source **WebGL wind** (`webgl-wind` ISC / WeatherLayers GL open core) | Animated streamlines from Open-Meteo wind |
| Rain radar | **RainViewer** free public API | Animated radar tiles, no key |
| Animation | Framer Motion | |
| Charts | Recharts | 7-day trend in the panel |
| Weather data (MVP) | **Open-Meteo** | No key; point + multi-point grid; soil temp/moisture, wind, precip, ET0, frost |
| Geocoding | Open-Meteo Geocoding API | ⌘K search |
| Weather data (later) | KNMI Open Data | NL authority; Phase 3, free key in `.env` |
| PWA | `vite-plugin-pwa` | Installable to phone; advances Phase 4 |
| Deploy | **Cloudflare Pages / Vercel free tier** | Static site, no backend → $0 forever. **Not Railway** |

---

## Core Rules

- **$0 always.** Never add a dependency or service that costs money or risks a bill. No paid keys, no backend, no metered APIs beyond the free tiers listed above.
- **Never hardcode API keys.** MVP needs none; when KNMI is added, its free key goes in `.env` (gitignored), never in source.
- **The product is judgment, not data.** Every feature must answer a farmer's decision ("can I spray?"), not just display a number.
- **Crop logic is data, not code.** Crop thresholds live as config in `src/data/`, evaluated by a generic engine. Adding a crop = adding a config object, never editing the engine.
- **NL-first.** Default location, units (°C, mm, km/h), framing, and legal thresholds (e.g. spray wind limits) assume the Netherlands.
- **Mobile from day one.** Every screen must work on a phone — responsive, not bolted on.
- **One thing done well beats ten shallow.** Get the immersive map genuinely impressive before piling on features.

---

## Project Plan

### Phase 1 — The immersive map foundation
Goal: a full-screen living NL map you can search, click, and read conditions from.

**Session 1: Scaffold + the map** ✅ done (2026-06-15)
- [x] Init Vite + React 18 + TS; add Tailwind; dark theme tokens *(shadcn/ui deferred to Session 2 — it lands with the ⌘K command palette; the glass panel needed only Tailwind)*
- [x] Full-bleed MapLibre GL map of NL with a dark style (CARTO dark_all raster, no token)
- [x] Cinematic globe → NL `flyTo` intro on load (globe projection attempted, raster-mercator fallback)
- [x] `src/lib/openMeteo.ts` — typed `getForecast(lat, lon)`
- [x] Click map → floating glass panel showing that point's live metrics (temp, wind, precip, soil temp, humidity)
- Verified: `npm run build` passes, dev server serves 200, Open-Meteo returns live NL data.

**Session 2: Search + the glass panel** ✅ done (2026-06-15)
- [x] ⌘K location search (Open-Meteo geocoding) + click-to-pick + "use my location"
- [x] Camera fly-to animation + marker on select (was already wired in Session 1; confirmed working)
- [x] Polish the glass panel: metric layout, animated counters, 7-day SVG sparkline, Framer Motion enter/exit

**Session 3: The living overlays** ✅ done (2026-06-15)
- [x] NL grid sampler + `getGridForecast(points[])` with caching (88 pts, single batch request, 10-min cache)
- [x] MapLibre heatmap from sampled scores (temperature) + layer switcher with animated cross-fade
- [x] Animated wind particle layer (canvas bilinear-interpolated particle system, 1800 particles)
- [x] Live rain radar overlay (RainViewer, looping 600 ms/frame)

### Phase 2 — From data to judgment
Goal: turn the panel into actual farm advice with a rules engine.

**Session 4: Rules engine + advice strip** ✅ done (2026-06-16)
- [x] Crop-threshold schema in `src/types/crop.ts`; `scoreCurrentConditions` + `scoreDay` in `src/lib/evaluate.ts`
- [x] Maize crop config in `src/data/maize.ts` (spray, frost, harvest thresholds; ctgb.nl wind limits)
- [x] Daily `wind_speed_10m_max` added to Open-Meteo request + `DailyForecast` type
- [x] Advice strip in the panel: spray go/no-go, frost alert, harvest window — glowing green/amber/red indicators
- [x] "Best window" rows — 7 day columns with colored dots for spray + harvest; frost ❄ indicator per day

**Session 5: Crop picker + Dutch legal thresholds** ✅ done (2026-06-16)
- [x] Crop picker UI in the panel (pill tabs); re-scores all advice on change
- [x] Added 3 more crop configs: Aardappel, Tarwe, Ui (`src/data/`) — `ALL_CROPS` barrel in `src/data/crops.ts`
- [x] Dutch legal spray wind limits (ctgb.nl class I/II/III) in `src/data/sprayLegal.ts`; `pesticideClass` on each CropConfig; "⚖ Wettelijk verboden" badge in spray card + ⚖ indicator in 7-day spray window row

### Phase 3 — Make it yours
Goal: saved fields + shareability — turns the tool from demo into something a farmer returns to.

**Session 6: Field bookmarks + deeplink sharing** ✅ done (2026-06-16)
- [x] Field bookmarks (localStorage): save named fields, quick-switch from a side panel or top bar
- [x] Each bookmark shows a live status dot (go/caution/stop) for the current active crop
- [x] Deeplink: read `?lat=&lon=` on load, write it on field select — shareable URLs, zero backend

**Session 7: Polish + PWA + ship** ✅ done (2026-06-16)
- [x] Skeleton loading states in ConditionPanel (animated pulse skeleton replacing plain text)
- [x] Mobile bottom-sheet: ConditionPanel is fixed full-width bottom sheet on mobile, floating card on ≥md
- [x] Drag handle indicator on mobile panel
- [x] `vite-plugin-pwa` — installable to home screen; service worker with Workbox precaching + Open-Meteo runtime cache
- [x] Deploy: Vercel free tier via GitHub push

### Phase 4 — Living map overlays (if still wanted)
Country-wide heatmaps and wind particles are beautiful but not the core product. Revisit here once farm advice is proven.
- [ ] NL grid sampler → MapLibre heatmap showing spray suitability score across the country
- [ ] Animated wind particle layer; RainViewer rain radar overlay; layer switcher
- [ ] deck.gl upgrade for smoother interpolation if needed

---

## Architecture Notes

- **`src/lib/openMeteo.ts`** — typed client: `getForecast(lat, lon)` for the panel, `getGridForecast(points[])` for future overlays.
- **Rules engine** — `src/types/crop.ts` (threshold schema), `src/lib/evaluate.ts` (`scoreDay(forecast, crop)` → `{spray, frost, harvest}` scores), `src/data/*.ts` (crop configs). Adding a crop = adding one config file, never touching the engine.
- **Dutch legal thresholds** — `src/data/sprayLegal.ts`: pesticide class → max wind speed (km/h) per ctgb.nl. Evaluated separately from crop thresholds; shown as a distinct "legally off-limits" flag.
- **Field bookmarks** — `localStorage` key `farmcast:fields`: `{ id, name, lat, lon }[]`. A `useFields` hook manages CRUD + live status dots via `usePointForecast` per saved field.
- **Deeplinks** — `App.tsx` reads `?lat=&lon=` on mount via `URLSearchParams`; writes it on every field select with `history.replaceState`.
- **State** — React hooks + `localStorage` for bookmarks. Add Zustand only if selected crop + time index + active overlay become painful to thread as props.

---

## Session Checklist

**At the start of every session:**
1. Read this CLAUDE.md — find which session you're on
2. `ls` the project root — see what already exists
3. Run the project (`npm run dev`) to confirm last session's work still holds

**At the end of every session:**
1. Code runs without errors (`npm run dev` + `npm run build`)
2. Mark completed tasks with [x] in the plan above
3. Commit to git: `git add -A && git commit -m "[session N]: [what was done]"`
4. Note any open decisions or blockers here or in a `notes.md`
