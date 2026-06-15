import type { Bbox, LatLon } from '@/types/weather';

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
