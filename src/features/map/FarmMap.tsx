import { useCallback, useEffect, useRef } from "react";
import Map, {
  AttributionControl,
  Marker,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { motion } from "framer-motion";
import type { LatLon } from "@/types/weather";
import { DARK_MAP_STYLE, INTRO_VIEW, NL_VIEW } from "./mapStyle";

interface FarmMapProps {
  selected: LatLon | null;
  onSelect: (point: LatLon) => void;
}

export function FarmMap({ selected, onSelect }: FarmMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  // Cinematic intro: start wide/high, then fly down to the Netherlands.
  // Globe projection is attempted but degrades gracefully if unsupported.
  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    try {
      // MapLibre v4 globe projection — wrapped in case the runtime lacks it.
      (map as unknown as { setProjection?: (p: unknown) => void }).setProjection?.(
        { type: "globe" },
      );
    } catch {
      /* raster mercator fallback — fine */
    }

    map.flyTo({
      center: [NL_VIEW.longitude, NL_VIEW.latitude],
      zoom: NL_VIEW.zoom,
      duration: 3200,
      essential: true,
      curve: 1.4,
    });
  }, []);

  // When a location is selected elsewhere (search, geolocation), ease to it.
  useEffect(() => {
    if (!selected) return;
    mapRef.current
      ?.getMap()
      .easeTo({ center: [selected.lon, selected.lat], duration: 1200 });
  }, [selected]);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      onSelect({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    },
    [onSelect],
  );

  return (
    <Map
      ref={mapRef}
      mapStyle={DARK_MAP_STYLE}
      initialViewState={INTRO_VIEW}
      onLoad={handleLoad}
      onClick={handleClick}
      attributionControl={false}
      cursor="crosshair"
      style={{ position: "absolute", inset: 0 }}
    >
      <AttributionControl compact position="bottom-left" />
      {selected && (
        <Marker longitude={selected.lon} latitude={selected.lat} anchor="center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative"
          >
            <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-brand/30" />
            <span className="block h-3.5 w-3.5 rounded-full border-2 border-white bg-brand shadow-[0_0_12px_2px_rgba(56,189,248,0.8)]" />
          </motion.div>
        </Marker>
      )}
    </Map>
  );
}
