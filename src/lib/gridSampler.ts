import type { Bbox, GridPoint, LatLon, OverlayLayer } from '@/types/weather';

export const NL_BBOX: Bbox = { latMin: 50.75, latMax: 53.55, lonMin: 3.35, lonMax: 7.22 };

// 6×6 = 36 points per viewport — one Open-Meteo batch request, works worldwide.
export const GRID_DENSITY = 6;

/**
 * Generate a uniform GRID_DENSITY×GRID_DENSITY grid within the given bbox.
 * Points are ordered lat-ascending (row), lon-ascending (column).
 */
export function generateViewportGrid(bbox: Bbox, density = GRID_DENSITY): LatLon[] {
  const pts: LatLon[] = [];
  const latRange = bbox.latMax - bbox.latMin;
  const lonRange = bbox.lonMax - bbox.lonMin;
  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      pts.push({
        lat: +(bbox.latMin + (i / (density - 1)) * latRange).toFixed(4),
        lon: +(bbox.lonMin + (j / (density - 1)) * lonRange).toFixed(4),
      });
    }
  }
  return pts;
}

/**
 * Bilinearly interpolate wind U/V at any lat/lon from a density×density grid.
 * Points outside the bbox return {u:0, v:0} — particles simply stop there.
 */
export function interpolateWind(
  lat: number,
  lon: number,
  grid: GridPoint[],
  bbox: Bbox,
  density = GRID_DENSITY,
): { u: number; v: number } {
  if (grid.length < density * density) return { u: 0, v: 0 };

  const latStep = (bbox.latMax - bbox.latMin) / (density - 1);
  const lonStep = (bbox.lonMax - bbox.lonMin) / (density - 1);

  const lf = (lat - bbox.latMin) / latStep;
  const cf = (lon - bbox.lonMin) / lonStep;

  // Clamp to grid interior so we always get valid bilinear corners
  const latLo = Math.max(0, Math.min(Math.floor(lf), density - 2));
  const lonLo = Math.max(0, Math.min(Math.floor(cf), density - 2));
  const lt = lf - latLo;
  const ct = cf - lonLo;

  const uv = (li: number, lo: number) => {
    const p = grid[li * density + lo];
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

/** Normalize a value into [0,1] for heatmap weight. */
export function scoreForLayer(p: GridPoint, layer: OverlayLayer): number {
  switch (layer) {
    case 'temperature': return clamp((p.temperature + 5) / 40, 0, 1);
    case 'wind':        return clamp(p.windSpeed / 50, 0, 1);
    case 'rain':        return clamp(p.precipitation / 5, 0, 1);
    default:            return 0;
  }
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
