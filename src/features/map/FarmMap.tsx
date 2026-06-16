import { useCallback, useRef, useState } from "react";
import Map, {
  AttributionControl,
  Marker,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { motion } from "framer-motion";
import type { LatLon } from "@/types/weather";
import { DARK_MAP_STYLE, SATELLITE_MAP_STYLE, NL_VIEW } from "./mapStyle";

interface FarmMapProps {
  selected: LatLon | null;
  onSelect: (point: LatLon) => void;
}

export function FarmMap({ selected, onSelect }: FarmMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [styleMode, setStyleMode] = useState<'dark' | 'satellite'>('dark');

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
        mapStyle={styleMode === 'satellite' ? SATELLITE_MAP_STYLE : DARK_MAP_STYLE}
        initialViewState={NL_VIEW}
        onClick={handleClick}
        attributionControl={false}
        cursor="crosshair"
        style={{ width: "100%", height: "100%" }}
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
              <span className="block h-3.5 w-3.5 rounded-full border-2 border-white bg-brand shadow-[0_0_12px_2px_rgba(214,162,74,0.85)]" />
            </motion.div>
          </Marker>
        )}
      </Map>

      {/* Satellite / dark map toggle — lifted above home indicator on notch devices */}
      <button
        onClick={() => setStyleMode((m) => m === 'dark' ? 'satellite' : 'dark')}
        className={[
          'absolute right-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5',
          'border text-xs font-medium backdrop-blur-md transition-colors',
          styleMode === 'satellite'
            ? 'border-brand/60 bg-brand/20 text-brand'
            : 'border-white/15 bg-black/40 text-white/70 hover:border-white/30 hover:text-white',
        ].join(' ')}
        style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
        title={styleMode === 'dark' ? 'Schakel naar satellietkaart' : 'Schakel naar donkere kaart'}
      >
        {styleMode === 'dark' ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h4.59l-2.1 1.95a.75.75 0 001.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 10-1.02 1.1l2.1 1.95H6.75z" clipRule="evenodd" />
            </svg>
            Satelliet
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v4.25H5a.75.75 0 000 1.5h4.25V15a.75.75 0 001.5 0v-4.25H15a.75.75 0 000-1.5h-4.25V5z" clipRule="evenodd" />
            </svg>
            Donker
          </>
        )}
      </button>
    </div>
  );
}
