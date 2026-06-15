import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { GridPoint, OverlayLayer } from '@/types/weather';
import { temperatureScore } from '@/lib/gridSampler';

interface HeatmapLayerProps {
  gridPoints: GridPoint[];
  activeLayer: OverlayLayer;
}

export function HeatmapLayer({ gridPoints, activeLayer }: HeatmapLayerProps) {
  const visible = activeLayer === 'temperature';

  const geoData = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: gridPoints.map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] as [number, number] },
        properties: { score: temperatureScore(p), temperature: p.temperature },
      })),
    }),
    [gridPoints],
  );

  return (
    <Source id="fc-heatmap-src" type="geojson" data={geoData}>
      <Layer
        id="fc-heatmap"
        type="heatmap"
        layout={{ visibility: visible ? 'visible' : 'none' }}
        paint={{
          'heatmap-weight': ['get', 'score'],
          // 1.8 pushes the density value up so colour bands appear at realistic
          // summer temperatures (~15–22 °C in NL) rather than only at extremes.
          'heatmap-intensity': 1.8,
          // The 6×6 viewport grid always places ~6 points across the screen.
          // Spacing ≈ viewport_px / 5. We need radius ≥ half that to blend.
          // On a typical 1280 px screen that's ~128 px — use 200+ for good overlap.
          'heatmap-radius': [
            'interpolate', ['exponential', 2], ['zoom'],
            2,  150,
            4,  200,
            6,  260,
            8,  350,
            11, 600,
          ],
          'heatmap-opacity': 0.72,
          // Thresholds are tuned for the actual density values produced by
          // the combination of heatmap-weight (0–1) × intensity (1.8):
          // max density ≈ 1.0 at the hot end, ~0.05 at the transparent floor.
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,    'rgba(0,0,0,0)',
            0.03, 'rgba(50,100,230,0.72)',   // deep blue  — cold
            0.18, 'rgba(0,180,160,0.82)',    // teal       — cool
            0.38, 'rgba(70,215,55,0.85)',    // green      — mild / optimal
            0.60, 'rgba(245,175,0,0.86)',    // amber      — warm
            0.80, 'rgba(235,70,20,0.88)',    // orange-red — hot
            1.0,  'rgba(180,0,50,0.90)',     // deep red   — very hot
          ],
        }}
      />
    </Source>
  );
}
