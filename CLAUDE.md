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

A single immersive screen:
- **Full-bleed dark MapLibre map** of the Netherlands, with a cinematic globe → NL fly-in on load.
- **Animated wind streamlines** flowing across the country (the signature Windy effect).
- **Live looping rain radar** (real precipitation, RainViewer).
- A **country-wide condition overlay** — a smooth heatmap whose color = a computed score (spray suitability, frost risk, rainfall) for that location, with a layer switcher.
- A **⌘K location search** + click-to-pick + "use my location"; selecting a field flies the camera there and opens a **floating glass panel** with live metrics and farm advice (spray go/no-go, frost alert, harvest window) — glowing status indicators, animated counters.
- A **time scrubber + auto-play time-lapse** that animates the overlay and advice across the 7-day forecast.

Crop logic is **data, not code**: each crop is a threshold config; a generic evaluator scores any forecast against it; the same scores drive both the panel and the map overlay.

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

**Session 2: Search + the glass panel**
- [ ] ⌘K location search (Open-Meteo geocoding) + click-to-pick + "use my location"
- [ ] Camera fly-to animation + marker on select
- [ ] Polish the glass panel: metric layout, animated counters, 7-day mini trend chart, Framer Motion enter/exit

**Session 3: The living overlays**
- [ ] NL grid sampler + `getGridForecast(points[])` with caching
- [ ] MapLibre heatmap from sampled scores (start: temperature) + layer switcher with animated cross-fade
- [ ] Animated wind particle layer (WebGL wind from Open-Meteo wind)
- [ ] Live rain radar overlay (RainViewer, looping)

### Phase 2 — From data to judgment
Goal: turn the map and panel into actual farm advice.

**Session 4: Rules engine**
- [ ] Crop-threshold schema in `src/types/`; generic `scoreDay` evaluator in `src/lib/`
- [ ] One sample crop config (e.g. maize); wire scores into the panel
- [ ] Switch a map overlay to a computed "spray suitability" score

**Session 5: Activity advisor + time scrubber**
- [ ] Glass panel advice: spray go/no-go, frost alert, harvest-window (runs of dry days) — glowing indicators
- [ ] 7-day time scrubber + auto-play time-lapse animating both panel advice and map overlay

**Session 6: Crop suitability**
- [ ] Crop picker; overlay + panel re-color by the selected crop's thresholds
- [ ] Add 2–3 more crop configs

### Phase 3 — Credibility & polish
**Session 7: KNMI + deck.gl upgrade** — add the NL authoritative source (free key in `.env`); upgrade overlays to deck.gl for smoother interpolation.
**Session 8: Polish + PWA + ship** — motion pass, skeleton/loading/error/empty states, mobile bottom-sheet panels, `vite-plugin-pwa`, deploy to Cloudflare Pages/Vercel (free), short landing/explainer.

### Phase 4 — Native mobile (later)
Decide PWA vs Capacitor vs React Native/Expo; build and test on a real phone.

---

## Architecture Notes

- **`src/lib/openMeteo.ts`** — typed client: `getForecast(lat, lon)` for the panel, `getGridForecast(points[])` (Open-Meteo accepts comma-separated multi-coordinates per request) for the country overlay.
- **Country overlay sampling** — precompute a grid over the NL bounding box (~lat 50.75–53.55, lon 3.35–7.22). MVP: coarse grid (~0.2–0.25°, ~150 pts), batched + cached. Each point → condition score → MapLibre heatmap with a green→amber→red ramp. Densify once it looks right.
- **Rules engine** — `src/types/crop.ts` (threshold schema), `src/lib/evaluate.ts` (`scoreDay(forecast, crop)`), `src/data/*.ts` (crop configs).
- **State** — light: React hooks + small store (Zustand if needed) for selected location, active layer, time index, selected crop.

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
