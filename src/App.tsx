import { useState } from "react";
import { motion } from "framer-motion";
import { FarmMap } from "@/features/map/FarmMap";
import { SearchPalette } from "@/features/map/SearchPalette";
import { ConditionPanel } from "@/features/dashboard/ConditionPanel";
import { usePointForecast } from "@/hooks/usePointForecast";
import type { LatLon, NamedLocation } from "@/types/weather";

export default function App() {
  const [selected, setSelected] = useState<LatLon | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

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
      <FarmMap selected={selected} onSelect={handleMapSelect} />

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

      {/* Bottom hint when nothing is selected */}
      {!selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
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
