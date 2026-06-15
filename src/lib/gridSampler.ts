import type { LatLon, GridPoint, OverlayLayer } from '@/types/weather';

export const NL_BBOX = {
  latMin: 50.75,
  latMax: 53.55,
  lonMin: 3.35,
  lonMax: 7.22,
} as const;

export const GRID_STEP = 0.4; // degrees (~44 km per step)

// Number of grid cells in each direction (derived from the loop bounds below)
export const NUM_LATS = Math.floor((NL_BBOX.latMax + 0.01 - NL_BBOX.latMin) / GRID_STEP) + 1; // 8
export const NUM_LONS = Math.floor((NL_BBOX.lonMax + GRID_STEP - NL_BBOX.lonMin) / GRID_STEP) + 1; // 11

/** Generate the flat NL grid, ordered lat-ascending then lon-ascending. */
export function generateNLGrid(): LatLon[] {
  const points: LatLon[] = [];
  for (let latI = 0; latI < NUM_LATS; latI++) {
    for (let lonI = 0; lonI < NUM_LONS; lonI++) {
      points.push({
        lat: +(NL_BBOX.latMin + latI * GRID_STEP).toFixed(3),
        lon: +(NL_BBOX.lonMin + lonI * GRID_STEP).toFixed(3),
      });
    }
  }
  return points;
}

/** Bilinearly interpolate wind U/V at the given lat/lon from the grid. */
export function interpolateWind(
  lat: number,
  lon: number,
  grid: GridPoint[],
): { u: number; v: number } {
  const lf = Math.max(0, (lat - NL_BBOX.latMin) / GRID_STEP);
  const cf = Math.max(0, (lon - NL_BBOX.lonMin) / GRID_STEP);

  const latLo = Math.min(Math.floor(lf), NUM_LATS - 2);
  const lonLo = Math.min(Math.floor(cf), NUM_LONS - 2);
  const lt = lf - latLo;
  const ct = cf - lonLo;

  const uv = (li: number, lo: number) => {
    const p = grid[Math.max(0, li) * NUM_LONS + Math.max(0, lo)];
    return p ? { u: p.windU, v: p.windV } : { u: 0, v: 0 };
  };

  const bl = uv(latLo, lonLo);
  const br = uv(latLo, lonLo + 1);
  const tl = uv(latLo + 1, lonLo);
  const tr = uv(latLo + 1, lonLo + 1);

  return {
    u: (1 - lt) * (1 - ct) * bl.u + (1 - lt) * ct * br.u + lt * (1 - ct) * tl.u + lt * ct * tr.u,
    v: (1 - lt) * (1 - ct) * bl.v + (1 - lt) * ct * br.v + lt * (1 - ct) * tl.v + lt * ct * tr.v,
  };
}

/** Compute a [0,1] score for the heatmap weight based on the active layer. */
export function scoreForLayer(p: GridPoint, layer: OverlayLayer): number {
  switch (layer) {
    case 'temperature':
      return clamp((p.temperature + 5) / 40, 0, 1);
    case 'wind':
      return clamp(p.windSpeed / 50, 0, 1);
    case 'rain':
      return clamp(p.precipitation / 5, 0, 1);
    default:
      return 0;
  }
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
