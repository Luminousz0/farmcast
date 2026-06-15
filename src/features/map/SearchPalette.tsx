import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { searchLocation, type GeoResult } from "@/lib/geocoding";
import type { NamedLocation } from "@/types/weather";

interface SearchPaletteProps {
  onSelect: (loc: NamedLocation) => void;
}

const BACKDROP = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

const DIALOG = {
  initial: { opacity: 0, y: -16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.97 },
  transition: { type: "spring" as const, stiffness: 420, damping: 32 },
};

export function SearchPalette({ onSelect }: SearchPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ⌘K / Ctrl+K to open, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Reset state and focus input when palette opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIdx(0);
      // Tiny delay so the portal renders before we try to focus
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Debounced geocoding search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchLocation(query);
        setResults(res);
        setActiveIdx(0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const pick = useCallback(
    (r: GeoResult) => {
      const name = r.admin1 ? `${r.name}, ${r.admin1}` : r.name;
      onSelect({ lat: r.lat, lon: r.lon, name });
      setOpen(false);
    },
    [onSelect],
  );

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelect({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: "Mijn locatie",
        });
        setLocating(false);
        setOpen(false);
      },
      () => setLocating(false),
    );
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const r = results[activeIdx];
      if (r) pick(r);
    }
  };

  return (
    <>
      {/* Trigger button — top-right of the map UI */}
      <button
        onClick={() => setOpen(true)}
        className="glass pointer-events-auto flex items-center gap-2 px-3 py-2 text-sm text-white/60 transition-colors hover:text-white"
        aria-label="Zoek locatie (⌘K)"
      >
        <SearchIcon />
        <span className="hidden sm:inline">Zoek locatie</span>
        <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/40 sm:inline">
          ⌘K
        </kbd>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                {...BACKDROP}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />

              {/* Flex-centering wrapper — avoids Framer Motion's inline transform
                  overwriting Tailwind's -translate-y-1/2 class */}
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <motion.div
                key="dialog"
                {...DIALOG}
                className="w-[min(92vw,520px)] pointer-events-auto"
              >
                <div className="glass overflow-hidden">
                  {/* Search input */}
                  <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                    <SearchIcon className="shrink-0 text-white/40" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Zoek een locatie, dorp of perceel…"
                      className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                    />
                    {(query || searching) && (
                      <button
                        onClick={() => setQuery("")}
                        className="shrink-0 text-white/30 transition-colors hover:text-white/70"
                        aria-label="Wis zoekopdracht"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Results list */}
                  <div className="max-h-72 overflow-y-auto">
                    {/* Use my location */}
                    <button
                      onClick={useMyLocation}
                      disabled={locating}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/5 disabled:opacity-50"
                    >
                      <span className="text-base">📍</span>
                      <span className="text-white/70">
                        {locating ? "Locatie bepalen…" : "Gebruik mijn locatie"}
                      </span>
                    </button>

                    {results.length > 0 && (
                      <div className="border-t border-white/[0.06]">
                        {results.map((r, i) => (
                          <button
                            key={r.id}
                            onClick={() => pick(r)}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                              i === activeIdx
                                ? "bg-white/10"
                                : "hover:bg-white/5"
                            }`}
                          >
                            <span className="text-base">🌾</span>
                            <div className="min-w-0">
                              <div className="truncate font-medium text-white">
                                {r.name}
                              </div>
                              <div className="truncate text-xs text-white/40">
                                {[r.admin1, r.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {query.trim() && !searching && results.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-white/30">
                        Geen locaties gevonden voor &ldquo;{query}&rdquo;
                      </div>
                    )}

                    {searching && (
                      <div className="px-4 py-4 text-center text-xs text-white/30">
                        Zoeken…
                      </div>
                    )}
                  </div>

                  {/* Footer hint */}
                  <div className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-white/20">
                    ↑↓ navigeren &nbsp;·&nbsp; ↵ kiezen &nbsp;·&nbsp; Esc sluiten
                  </div>
                </div>
              </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  );
}
