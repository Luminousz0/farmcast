import { useCallback, useEffect, useRef, useState } from "react";
import Map, {
  AttributionControl,
  Marker,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { motion } from "framer-motion";
import type { Bbox, GridPoint, LatLon, OverlayLayer } from "@/types/weather";
import { DARK_MAP_STYLE, INTRO_VIEW, NL_VIEW } from "./mapStyle";
import { HeatmapLayer } from "./HeatmapLayer";
import { RainRadarLayer } from "./RainRadarLayer";
import { generateViewportGrid } from "@/lib/gridSampler";
import { getGridForecast } from "@/lib/openMeteo";

interface FarmMapProps {
  selected: LatLon | null;
  onSelect: (point: LatLon) => void;
  activeLayer: OverlayLayer;
}

export function FarmMap({ selected, onSelect, activeLayer }: FarmMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  const [gridPoints, setGridPoints] = useState<GridPoint[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  // layerHidden: true while the grid is stale (during zoom or initial load).
  // The overlay stays invisible until fresh data arrives so users never see
  // circles that don't match the current viewport zoom/position.
  const [layerHidden, setLayerHidden] = useState(true);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);

  const needsGrid = activeLayer === "temperature";

  const fetchViewportGrid = useCallback(async () => {
    const map = mapRef.current?.getMap();
    if (!map || fetchingRef.current) return;

    if (map.getZoom() < 3) return;

    const b = map.getBounds();
    if (!b) return;

    const bbox: Bbox = {
      latMin: Math.max(-85, b.getSouth()),
      latMax: Math.min(85, b.getNorth()),
      lonMin: b.getWest(),
      lonMax: b.getEast(),
    };

    fetchingRef.current = true;
    setGridLoading(true);
    try {
      const pts = await getGridForecast(generateViewportGrid(bbox));
      setGridPoints(pts);
      setLayerHidden(false); // fresh data ready — reveal overlay
    } catch {
      setLayerHidden(false); // show stale data rather than blank forever
    } finally {
      fetchingRef.current = false;
      setGridLoading(false);
    }
  }, []);

  // When switching to temperature: hide until the first fetch completes.
  useEffect(() => {
    if (needsGrid) {
      setLayerHidden(true);
      fetchViewportGrid();
    } else {
      setLayerHidden(true); // reset for next time layer is activated
    }
  }, [needsGrid, fetchViewportGrid]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.setProjection({ type: "globe" });

    map.flyTo({
      center: [NL_VIEW.longitude, NL_VIEW.latitude],
      zoom: NL_VIEW.zoom,
      duration: 3200,
      essential: true,
      curve: 1.4,
    });

    map.once("moveend", () => {
      map.setProjection({ type: "mercator" });
    });
  }, []);

  // When the user starts zooming, hide the overlay immediately — the sampled
  // grid is for the old zoom level and will look wrong (too-large or too-small
  // circles) until fresh data arrives after the zoom settles.
  const handleZoomStart = useCallback(() => {
    if (needsGrid) setLayerHidden(true);
  }, [needsGrid]);

  // After any map movement: debounce a grid refetch. onZoomEnd fires just
  // before onMoveEnd in MapLibre, so a single handler covers both.
  const handleMoveEnd = useCallback(() => {
    if (!needsGrid) return;
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(fetchViewportGrid, 700);
  }, [fetchViewportGrid, needsGrid]);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      onSelect({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    },
    [onSelect],
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Map
        ref={mapRef}
        mapStyle={DARK_MAP_STYLE}
        initialViewState={INTRO_VIEW}
        onLoad={handleLoad}
        onZoomStart={handleZoomStart}
        onMoveEnd={handleMoveEnd}
        onClick={handleClick}
        attributionControl={false}
        cursor="crosshair"
        style={{ width: "100%", height: "100%" }}
      >
        <AttributionControl compact position="bottom-left" />

        <HeatmapLayer
          gridPoints={gridPoints}
          activeLayer={activeLayer}
          hidden={layerHidden}
        />
        <RainRadarLayer activeLayer={activeLayer} />

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

      {needsGrid && gridLoading && (
        <div className="glass pointer-events-none absolute left-1/2 top-5 z-10 flex -translate-x-1/2 items-center gap-2 px-3 py-1.5 text-xs text-white/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          Condities laden…
        </div>
      )}
    </div>
  );
}
