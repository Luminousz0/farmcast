import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DailyForecast, PointForecast } from "@/types/weather";
import type { ConditionScore, CropConfig } from "@/types/crop";
import type { CurrentAdvice, DayWindowScore } from "@/lib/evaluate";
import { scoreCurrentConditions, scoreDay } from "@/lib/evaluate";
import { ALL_CROPS } from "@/data/crops";
import { describeWeatherCode } from "@/lib/weatherCode";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface ConditionPanelProps {
  forecast: PointForecast | null;
  loading: boolean;
  error: string | null;
  label: string;
  selectedCrop: CropConfig;
  onCropChange: (crop: CropConfig) => void;
  onSave: (name: string) => void;
  onClose: () => void;
}

interface MetricProps {
  label: string;
  value: number | undefined;
  unit: string;
  decimals?: number;
}

function Metric({ label, value, unit, decimals = 0 }: MetricProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-white/40">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-white">
          {value === undefined ? (
            <span className="text-white/30">—</span>
          ) : (
            <AnimatedNumber value={value} decimals={decimals} />
          )}
        </span>
        <span className="text-sm text-white/40">{unit}</span>
      </div>
    </div>
  );
}

function compassPoint(deg: number): string {
  const dirs = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function WindCompass({ speed, direction }: { speed: number; direction: number }) {
  const label = compassPoint(direction);

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const major = i % 3 === 0;
    const rad = ((i * 30) - 90) * (Math.PI / 180);
    const r1 = 43, r2 = major ? 36 : 39;
    return { x1: Math.cos(rad) * r1, y1: Math.sin(rad) * r1,
             x2: Math.cos(rad) * r2, y2: Math.sin(rad) * r2, major };
  });

  return (
    <div className="col-span-2 rounded-xl border border-white/5 bg-white/[0.03] py-3">
      <div className="px-3 text-[11px] font-medium uppercase tracking-wide text-white/40">
        Wind
      </div>
      <div className="flex justify-center pt-1">
        <svg viewBox="-50 -50 100 100" width="150" height="150" aria-label={`Wind ${Math.round(speed)} km/u uit het ${label}`}>
          <circle cx="0" cy="0" r="44" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.major ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.09)"}
              strokeWidth={t.major ? 1.2 : 0.8}
            />
          ))}
          {(["N", "O", "Z", "W"] as const).map((lbl, i) => {
            const rad = (i * 90 - 90) * (Math.PI / 180);
            const isN = lbl === "N";
            return (
              <text
                key={lbl}
                x={Math.cos(rad) * 30}
                y={Math.sin(rad) * 30}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isN ? "#38bdf8" : "rgba(255,255,255,0.32)"}
                fontSize={isN ? "9" : "7.5"}
                fontWeight={isN ? "700" : "400"}
                fontFamily="Inter Tight, system-ui, sans-serif"
              >
                {lbl}
              </text>
            );
          })}
          <g transform={`rotate(${direction})`}>
            <circle cx="0" cy="-25" r="4.5" fill="#38bdf8" />
            <line x1="0" y1="-20" x2="0" y2="17" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="0,27 -4.5,17 4.5,17" fill="#38bdf8" />
          </g>
          <circle cx="0" cy="0" r="14" fill="rgba(7,11,20,0.85)" />
          <circle cx="0" cy="0" r="14" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="1" />
          <text x="0" y="-3.5" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Inter Tight, system-ui, sans-serif">
            {Math.round(speed)}
          </text>
          <text x="0" y="6" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.38)" fontSize="4.5" fontFamily="Inter Tight, system-ui, sans-serif">
            km/u
          </text>
        </svg>
      </div>
      <div className="pb-1 text-center text-[11px] text-white/30">
        uit het {label}
      </div>
    </div>
  );
}

// ── Condition color helpers ─────────────────────────────────────────────────

const SCORE_COLOR: Record<ConditionScore, string> = {
  go:      '#34d399',
  caution: '#fbbf24',
  stop:    '#f87171',
};

const SCORE_LABEL: Record<ConditionScore, string> = {
  go:      'Go',
  caution: 'Let op',
  stop:    'Nee',
};

// ── Crop picker ─────────────────────────────────────────────────────────────

interface CropPickerProps {
  crops: CropConfig[];
  selected: CropConfig;
  onChange: (crop: CropConfig) => void;
}

function CropPicker({ crops, selected, onChange }: CropPickerProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {crops.map((crop) => {
        const active = crop.id === selected.id;
        return (
          <button
            key={crop.id}
            onClick={() => onChange(crop)}
            className="rounded-full px-3 py-1 text-[11px] font-medium transition"
            style={
              active
                ? { background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.35)' }
                : { background: 'transparent', color: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.10)' }
            }
          >
            {crop.name}
          </button>
        );
      })}
    </div>
  );
}

// ── Advice strip ────────────────────────────────────────────────────────────

interface AdviceCardProps {
  title: string;
  score: ConditionScore;
  reason: string;
  legallyBlocked?: boolean;
  legalReason?: string;
}

function AdviceCard({ title, score, reason, legallyBlocked, legalReason }: AdviceCardProps) {
  const color = SCORE_COLOR[score];
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2 py-2.5 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wide text-white/40">
        {title}
      </div>
      <div
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px 2px ${color}55` }}
      />
      <div className="text-[11px] font-semibold" style={{ color }}>
        {SCORE_LABEL[score]}
      </div>
      <div className="text-[10px] leading-tight text-white/35">{reason}</div>
      {legallyBlocked && (
        <div
          className="mt-0.5 w-full rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-tight"
          style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}
          title={legalReason}
        >
          ⚖ Wettelijk verboden
        </div>
      )}
    </div>
  );
}

interface FrostCardProps {
  hasFrost: boolean;
  reason: string;
}

function FrostCard({ hasFrost, reason }: FrostCardProps) {
  const color = hasFrost ? '#f87171' : '#34d399';
  const label = hasFrost ? 'Risico' : 'Veilig';
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2 py-2.5 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wide text-white/40">
        Vorst
      </div>
      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px 2px ${color}55` }} />
      <div className="text-[11px] font-semibold" style={{ color }}>{label}</div>
      <div className="text-[10px] leading-tight text-white/35">{reason}</div>
    </div>
  );
}

interface AdviceStripProps {
  advice: CurrentAdvice;
  crop: CropConfig;
}

function AdviceStrip({ advice, crop }: AdviceStripProps) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wide text-white/40">
          Veldadvies nu
        </div>
        <div className="text-[10px] text-white/25">{crop.name}</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <AdviceCard
          title="Spuiten"
          score={advice.spray}
          reason={advice.sprayReason}
          legallyBlocked={advice.sprayLegallyBlocked}
          legalReason={advice.sprayLegalReason}
        />
        <FrostCard hasFrost={advice.frost} reason={advice.frostReason} />
        <AdviceCard title="Oogsten" score={advice.harvest} reason={advice.harvestReason} />
      </div>
    </div>
  );
}

// ── 7-day window row ────────────────────────────────────────────────────────

interface BestWindowRowProps {
  daily: DailyForecast[];
  scores: DayWindowScore[];
}

function BestWindowRow({ daily, scores }: BestWindowRowProps) {
  const days = daily.map((d) =>
    new Date(`${d.date}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "short" }),
  );

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-3">
      <div className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-white/40">
        Spuitvenster — 7 dagen
      </div>
      <div className="grid grid-cols-7 gap-1">
        {scores.map((s, i) => {
          const color = SCORE_COLOR[s.spray];
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="text-[10px] text-white/30">{days[i]}</div>
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 6px 1px ${color}66` }}
              />
              {s.frost && (
                <div className="text-[9px] leading-none" title="Vorstrisico">❄</div>
              )}
              {s.sprayLegallyBlocked && (
                <div className="text-[8px] leading-none text-[#f87171]" title="Wettelijk verboden">⚖</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/40">
          Oogstvenster — 7 dagen
        </div>
        <div className="grid grid-cols-7 gap-1">
          {scores.map((s, i) => {
            const color = SCORE_COLOR[s.harvest];
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="text-[10px] text-white/30">{days[i]}</div>
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 6px 1px ${color}66` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sparkline ───────────────────────────────────────────────────────────────

function WeekSparkline({ daily }: { daily: DailyForecast[] }) {
  if (daily.length < 2) return null;

  const temps = daily.map((d) => d.tempMax);
  const rains = daily.map((d) => d.precipitation);
  const maxRain = Math.max(...rains, 0.1);

  const W = 100;
  const H_TEMP = 42;
  const H_GAP  = 4;
  const H_RAIN = 12;
  const H_TOTAL = H_TEMP + H_GAP + H_RAIN;

  const dataLo = Math.min(...temps);
  const dataHi = Math.max(...temps);
  const dataRange = dataHi - dataLo || 1;
  const domainPad = Math.max(dataRange * 0.12, 1);
  const lo = dataLo - domainPad;
  const hi = dataHi + domainPad;
  const range = hi - lo;

  const pts = temps.map((t, i) => ({
    x: (i / (temps.length - 1)) * W,
    y: ((hi - t) / range) * H_TEMP,
  }));

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const area =
    line +
    ` L ${pts[pts.length - 1].x.toFixed(1)} ${H_TEMP} L ${pts[0].x.toFixed(1)} ${H_TEMP} Z`;

  const days = daily.map((d) =>
    new Date(`${d.date}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "short" }),
  );

  const icons = daily.map((d) => describeWeatherCode(d.weatherCode).glyph);

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-3">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/40">
        Temperatuur — 7 dagen
      </div>
      <svg
        viewBox={`0 0 ${W} ${H_TOTAL}`}
        preserveAspectRatio="none"
        className="h-20 w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="fc-spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#fc-spark-grad)" />
        <path d={line} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.8} fill="#38bdf8" />
        ))}
        <line x1="0" y1={H_TEMP + H_GAP / 2} x2={W} y2={H_TEMP + H_GAP / 2} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        {rains.map((r, i) => {
          if (r < 0.1) return null;
          const x = (i / (rains.length - 1)) * W;
          const barH = (r / maxRain) * H_RAIN;
          return (
            <rect key={i} x={x - 3} y={H_TOTAL - barH} width={6} height={barH} fill="rgba(56,189,248,0.5)" rx={1} />
          );
        })}
      </svg>

      <div className="mt-1.5 flex justify-between">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-white/30">{d}</span>
            <span className="text-[13px] leading-none">{icons[i]}</span>
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-white/50">
        {temps.map((t, i) => (
          <span key={i}>{t.toFixed(0)}°</span>
        ))}
      </div>
    </div>
  );
}

// ── Main panel ──────────────────────────────────────────────────────────────

export function ConditionPanel({
  forecast,
  loading,
  error,
  label,
  selectedCrop,
  onCropChange,
  onSave,
  onClose,
}: ConditionPanelProps) {
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState("");
  const saveInputRef = useRef<HTMLInputElement>(null);

  const current = forecast?.current;
  const weather = current ? describeWeatherCode(current.weatherCode) : null;

  const advice = current ? scoreCurrentConditions(current, selectedCrop) : null;
  const windowScores: DayWindowScore[] =
    forecast?.daily.map((d) => scoreDay(d, selectedCrop)) ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSave) { setShowSave(false); return; }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, showSave]);

  useEffect(() => {
    if (showSave) {
      setSaveName(label);
      saveInputRef.current?.focus();
      saveInputRef.current?.select();
    }
  }, [showSave, label]);

  return (
    <AnimatePresence>
      <motion.div
        key="condition-panel"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="glass pointer-events-auto w-[min(92vw,360px)] max-h-[85vh] overflow-y-auto p-4 text-white"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium uppercase tracking-widest text-brand">
              Veldcondities
            </div>
            <div className="mt-0.5 truncate text-sm text-white/60">{label}</div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setShowSave((v) => !v)}
              className="rounded-lg px-2 py-1 text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Perceel opslaan"
              title="Perceel opslaan"
            >
              {showSave ? "✕" : "🔖"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Sluiten"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Save field row */}
        <AnimatePresence>
          {showSave && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-2 flex gap-1.5 overflow-hidden"
            >
              <input
                ref={saveInputRef}
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && saveName.trim()) {
                    onSave(saveName.trim());
                    setShowSave(false);
                  }
                }}
                placeholder="Naam perceel…"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[12px] text-white placeholder-white/25 outline-none focus:border-brand/50"
              />
              <button
                onClick={() => {
                  if (saveName.trim()) {
                    onSave(saveName.trim());
                    setShowSave(false);
                  }
                }}
                disabled={!saveName.trim()}
                className="rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-[12px] text-brand transition hover:bg-brand/20 disabled:opacity-30"
              >
                Opslaan
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crop picker */}
        <CropPicker crops={ALL_CROPS} selected={selectedCrop} onChange={onCropChange} />

        {loading && (
          <div className="py-8 text-center text-sm text-white/50">
            Gegevens laden…
          </div>
        )}

        {error && !loading && (
          <div className="mt-3 rounded-xl border border-stop/30 bg-stop/10 px-3 py-2 text-sm text-stop">
            {error}
          </div>
        )}

        {current && !loading && !error && (
          <>
            {/* Weather glyph + temperature */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-4xl">{weather?.glyph}</span>
              <div>
                <div className="text-3xl font-bold">
                  <AnimatedNumber value={current.temperature} decimals={1} />
                  <span className="ml-0.5 text-xl font-medium text-white/50">°C</span>
                </div>
                <div className="text-sm text-white/50">{weather?.label}</div>
              </div>
            </div>

            {/* Metric grid */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <WindCompass speed={current.windSpeed} direction={current.windDirection} />
              <Metric label="Neerslag" value={current.precipitation} unit="mm" decimals={1} />
              <Metric label="Bodemtemp." value={current.soilTemperature} unit="°C" decimals={1} />
              <Metric label="Vochtigheid" value={current.humidity} unit="%" />
              {current.soilMoisture !== undefined && (
                <Metric label="Bodemvocht" value={current.soilMoisture * 100} unit="%" decimals={1} />
              )}
            </div>

            {/* Farm advice strip */}
            {advice && <AdviceStrip advice={advice} crop={selectedCrop} />}

            {/* 7-day temperature sparkline */}
            {forecast.daily.length > 0 && (
              <WeekSparkline daily={forecast.daily} />
            )}

            {/* 7-day best window dots */}
            {forecast.daily.length > 0 && windowScores.length > 0 && (
              <BestWindowRow daily={forecast.daily} scores={windowScores} />
            )}

            <div className="mt-3 text-[11px] text-white/30">
              Bron: Open-Meteo ·{" "}
              {new Date(current.time).toLocaleString("nl-NL")}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
