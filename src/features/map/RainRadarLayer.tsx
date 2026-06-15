import { useEffect } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/maplibre';
import type { OverlayLayer } from '@/types/weather';
import { useRadarFrames } from '@/hooks/useRadarFrames';

interface RainRadarLayerProps {
  activeLayer: OverlayLayer;
}

const SOURCE_ID = 'fc-radar-src';
const LAYER_ID = 'fc-radar';

export function RainRadarLayer({ activeLayer }: RainRadarLayerProps) {
  const active = activeLayer === 'rain';
  const { tileUrl } = useRadarFrames(active);
  const { current: mapRef } = useMap();

  // Update tiles in-place instead of remounting the Source every 600ms.
  // Remounting causes MapLibre to discard cached tiles and re-request from scratch,
  // producing a visible blink and (under rapid key changes) source-id conflicts.
  useEffect(() => {
    if (!tileUrl || !mapRef) return;
    const map = mapRef.getMap();
    const src = map.getSource(SOURCE_ID) as { setTiles?: (t: string[]) => void } | undefined;
    src?.setTiles?.([tileUrl]);
  }, [tileUrl, mapRef]);

  if (!active || !tileUrl) return null;

  return (
    <Source
      id={SOURCE_ID}
      type="raster"
      tiles={[tileUrl]}
      tileSize={256}
      minzoom={2}
      maxzoom={8}
      attribution='<a href="https://www.rainviewer.com/api.html" target="_blank">RainViewer</a>'
    >
      <Layer
        id={LAYER_ID}
        type="raster"
        paint={{ 'raster-opacity': 0.80 }}
      />
    </Source>
  );
}
