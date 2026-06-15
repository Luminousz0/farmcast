import { useState } from "react";
import { motion } from "framer-motion";
import { FarmMap } from "@/features/map/FarmMap";
import { SearchPalette } from "@/features/map/SearchPalette";
import { LayerSwitcher } from "@/features/map/LayerSwitcher";
import { ConditionPanel } from "@/features/dashboard/ConditionPanel";
import { usePointForecast } from "@/hooks/usePointForecast";
import type { LatLon, NamedLocation, OverlayLayer } from "@/types/weather";

export default function App() {
  const [selected, setSelected] = useState<LatLon | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<OverlayLayer>("none");

  const { forecast, loading, error } = usePointForecast(selected);

  const handleMapSelect = (point: LatLon) => {
    setSelected(point);
    setSelectedName(null);
  };

  const handleSearchSelect = (loc: NamedLocation) => {
    setSelected({ lat: loc.lat, lon: loc.lon });
    setSelectedName(loc.name);
  };

  const label =
    selectedName ??
    (selected
      ? `${selected.lat.toFixed(4)}°N, ${selected.lon.toFixed(4)}°O`
      : "");

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Full-bleed map — manages its own viewport grid internally */}
      <FarmMap
        selected={selected}
        onSelect={handleMapSelect}
        activeLayer={activeLayer}
      />

      {/* Top-left: brand wordmark */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="pointer-events-none absolute left-5 top-5 z-10"
      >
        <div className="glass pointer-events-auto px-4 py-2">
          <span className="text-lg font-bold tracking-tight text-white">
            Farm<span className="text-brand">cast</span>
          </span>
        </div>
      </motion.header>

      {/* Top-right: ⌘K search palette */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="pointer-events-none absolute right-5 top-5 z-10"
      >
        <SearchPalette onSelect={handleSearchSelect} />
      </motion.div>

      {/* Right-center: layer switcher */}
      <div className="pointer-events-none absolute right-5 top-1/2 z-10 -translate-y-1/2">
        <LayerSwitcher activeLayer={activeLayer} onChange={setActiveLayer} />
      </div>

      {/* Heatmap legend — only meaningful for the temperature overlay */}
      {activeLayer === "temperature" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="glass pointer-events-none absolute bottom-6 left-5 z-10 px-3 py-2.5"
        >
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
            Temperatuur
          </div>
          <div
            className="h-2 w-40 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgb(50,100,230), rgb(0,180,160), rgb(70,215,55), rgb(245,175,0), rgb(235,70,20), rgb(180,0,50))",
            }}
          />
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-white/50">
            <span>0°</span>
            <span>15°</span>
            <span>30°+</span>
          </div>
        </motion.div>
      )}

      {/* Bottom hint when nothing is selected */}
      {!selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center"
        >
          <div className="glass px-4 py-2 text-sm text-white/70">
            Klik op de kaart of zoek een locatie om condities te bekijken
          </div>
        </motion.div>
      )}

      {/* Floating condition panel */}
      {selected && (
        <div className="absolute bottom-6 right-6 z-10">
          <ConditionPanel
            forecast={forecast}
            loading={loading}
            error={error}
            label={label}
            onClose={() => {
              setSelected(null);
              setSelectedName(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
