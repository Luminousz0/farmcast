import { useState } from "react";
import { motion } from "framer-motion";
import { FarmMap, type CropRegionSelectData } from "@/features/map/FarmMap";
import { SearchPalette } from "@/features/map/SearchPalette";
import { ConditionPanel } from "@/features/dashboard/ConditionPanel";
import { FieldsPanel } from "@/features/dashboard/FieldsPanel";
import { usePointForecast } from "@/hooks/usePointForecast";
import { useFields } from "@/hooks/useFields";
import { ALL_CROPS } from "@/data/crops";
import type { LatLon, NamedLocation } from "@/types/weather";
import type { CropConfig } from "@/types/crop";
import type { SavedField } from "@/types/field";

function readDeeplink(): LatLon | null {
  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get("lat") ?? "");
  const lon = parseFloat(params.get("lon") ?? "");
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
}

function writeDeeplink(point: LatLon) {
  const url = new URL(window.location.href);
  url.searchParams.set("lat", point.lat.toFixed(5));
  url.searchParams.set("lon", point.lon.toFixed(5));
  history.replaceState(null, "", url.toString());
}

function clearDeeplink() {
  const url = new URL(window.location.href);
  url.searchParams.delete("lat");
  url.searchParams.delete("lon");
  history.replaceState(null, "", url.toString());
}

export default function App() {
  const [selected, setSelected] = useState<LatLon | null>(() => readDeeplink());
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropConfig>(ALL_CROPS[0]);
  const [fieldsMobileOpen, setFieldsMobileOpen] = useState(false);

  const { forecast, loading, error } = usePointForecast(selected);
  const { fields, saveField, removeField } = useFields();

  const handleMapSelect = (point: LatLon) => {
    setSelected(point);
    setSelectedName(null);
    writeDeeplink(point);
  };

  const handleSearchSelect = (loc: NamedLocation) => {
    const point = { lat: loc.lat, lon: loc.lon };
    setSelected(point);
    setSelectedName(loc.name);
    writeDeeplink(point);
  };

  const handleFieldSelect = (f: SavedField) => {
    const point = { lat: f.lat, lon: f.lon };
    setSelected(point);
    setSelectedName(f.name);
    writeDeeplink(point);
  };

  const handleCropRegionSelect = (data: CropRegionSelectData) => {
    const point = { lat: data.lat, lon: data.lon };
    setSelected(point);
    setSelectedName(data.regionName);
    const crop = ALL_CROPS.find(c => c.id === data.cropId);
    if (crop) setSelectedCrop(crop);
    writeDeeplink(point);
  };

  const handleClose = () => {
    setSelected(null);
    setSelectedName(null);
    clearDeeplink();
  };

  const handleSave = (name: string) => {
    if (!selected) return;
    saveField({ name, lat: selected.lat, lon: selected.lon });
  };

  const label =
    selectedName ??
    (selected
      ? `${selected.lat.toFixed(4)}°N, ${selected.lon.toFixed(4)}°O`
      : "");

  return (
    <div className="relative h-full w-full overflow-hidden">
      <FarmMap selected={selected} onSelect={handleMapSelect} onCropRegionSelect={handleCropRegionSelect} />

      {/* Top-left: brand wordmark */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="pointer-events-none absolute left-5 top-5 z-10 pt-safe"
      >
        <div className="glass pointer-events-auto px-4 py-2">
          <span className="font-display text-xl font-semibold tracking-tight text-white">
            Farm<span className="text-brand">cast</span>
          </span>
        </div>
      </motion.header>

      {/* Top-right: ⌘K search palette */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="pointer-events-none absolute right-5 top-5 z-10 pt-safe"
      >
        <SearchPalette onSelect={handleSearchSelect} />
      </motion.div>

      {/* Left: saved fields bookmarks panel (desktop floating card + mobile drawer) */}
      <FieldsPanel
        fields={fields}
        crop={selectedCrop}
        onSelect={handleFieldSelect}
        onRemove={removeField}
        mobileOpen={fieldsMobileOpen}
        onMobileClose={() => setFieldsMobileOpen(false)}
      />

      {/* Mobile: bookmark toggle button — bottom-left, only when there are saved fields */}
      {fields.length > 0 && (
        <button
          onClick={() => setFieldsMobileOpen(true)}
          className="glass pointer-events-auto fixed bottom-6 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-base text-white/60 transition hover:text-white md:hidden"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
          aria-label="Mijn percelen"
        >
          🔖
        </button>
      )}

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

      {/* Condition panel — bottom sheet on mobile, floating card on desktop */}
      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-10 md:absolute md:inset-x-auto md:bottom-6 md:right-6">
          <ConditionPanel
            forecast={forecast}
            loading={loading}
            error={error}
            label={label}
            selectedCrop={selectedCrop}
            onCropChange={setSelectedCrop}
            onSave={handleSave}
            onClose={handleClose}
          />
        </div>
      )}
    </div>
  );
}
