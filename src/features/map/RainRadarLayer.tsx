import { Source, Layer } from 'react-map-gl/maplibre';
import type { OverlayLayer } from '@/types/weather';
import { useRadarFrames } from '@/hooks/useRadarFrames';

interface RainRadarLayerProps {
  activeLayer: OverlayLayer;
}

export function RainRadarLayer({ activeLayer }: RainRadarLayerProps) {
  const active = activeLayer === 'rain';
  const { tileUrl } = useRadarFrames(active);

  if (!active || !tileUrl) return null;

  // Each frame gets a different tile URL. MapLibre raster sources don't support
  // in-place tile updates, so we force React to remount the Source on every
  // frame change by using the URL as the key. This is how radar animation works.
  return (
    <Source
      key={tileUrl}
      id="fc-radar-src"
      type="raster"
      tiles={[tileUrl]}
      tileSize={256}
      attribution='<a href="https://www.rainviewer.com/api.html" target="_blank">RainViewer</a>'
    >
      <Layer
        id="fc-radar"
        type="raster"
        paint={{ 'raster-opacity': 0.75 }}
      />
    </Source>
  );
}
