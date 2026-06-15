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
import { WindParticles } from "./WindParticles";
import { generateViewportGrid } from "@/lib/gridSampler";
import { getGridForecast } from "@/lib/openMeteo";

interface FarmMapProps {
  selected: LatLon | null;
  onSelect: (point: LatLon) => void;
  activeLayer: OverlayLayer;
}

export function FarmMap({ selected, onSelect, activeLayer }: FarmMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  // Viewport-based grid: refetched after moveend, but only while a layer that
  // actually consumes it (heatmap / wind particles) is active.
  const [gridPoints, setGridPoints] = useState<GridPoint[]>([]);
  const [gridBbox, setGridBbox] = useState<Bbox>({
    latMin: 50.75, latMax: 53.55, lonMin: 3.35, lonMax: 7.22,
  });
  const [gridLoading, setGridLoading] = useState(false);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);

  // Only the temperature heatmap and wind particles read the sampled grid.
  const needsGrid = activeLayer === "temperature" || activeLayer === "wind";

  const fetchViewportGrid = useCallback(async () => {
    const map = mapRef.current?.getMap();
    if (!map || fetchingRef.current) return;

    const zoom = map.getZoom();
    // Too zoomed out — the bbox would span too many degrees for a useful 6×6 grid.
    if (zoom < 3) return;

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
      setGridBbox(bbox);
    } catch {
      // Keep existing data on API error; don't discard the last good grid.
    } finally {
      fetchingRef.current = false;
      setGridLoading(false);
    }
  }, []);

  // Fetch immediately when switching into a layer that needs the grid, using
  // the current viewport — so the overlay isn't blank until the next pan.
  useEffect(() => {
    if (needsGrid) fetchViewportGrid();
  }, [needsGrid, fetchViewportGrid]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Globe projection (maplibre v5+) gives the cinematic curved-earth intro.
    map.setProjection({ type: "globe" });

    map.flyTo({
      center: [NL_VIEW.longitude, NL_VIEW.latitude],
      zoom: NL_VIEW.zoom,
      duration: 3200,
      essential: true,
      curve: 1.4,
    });

    // The globe's atmospheric vignette is great for the fly-in but muddies the
    // flat condition overlays — drop back to mercator once the camera lands.
    map.once("moveend", () => {
      map.setProjection({ type: "mercator" });
    });
  }, []);

  // Debounce: wait 700 ms after the map stops moving before fetching. Only
  // refetch while a grid-backed layer is active (saves free-tier API calls).
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
        onMoveEnd={handleMoveEnd}
        onClick={handleClick}
        attributionControl={false}
        cursor="crosshair"
        style={{ width: "100%", height: "100%" }}
      >
        <AttributionControl compact position="bottom-left" />

        {/* These must be inside <Map> so they have access to the map context. */}
        <HeatmapLayer gridPoints={gridPoints} activeLayer={activeLayer} />
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

      {/* Canvas overlay — outside <Map> but inside the wrapper, z-stacked on top. */}
      {activeLayer === "wind" && (
        <WindParticles
          mapRef={mapRef}
          gridPoints={gridPoints}
          gridBbox={gridBbox}
        />
      )}

      {/* Overlay data is loading for a grid-backed layer */}
      {needsGrid && gridLoading && (
        <div className="glass pointer-events-none absolute left-1/2 top-5 z-10 flex -translate-x-1/2 items-center gap-2 px-3 py-1.5 text-xs text-white/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          Condities laden…
        </div>
      )}
    </div>
  );
}
