import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import type { DailyForecast, PointForecast } from "@/types/weather";
import type { ConditionScore, CropConfig } from "@/types/crop";
import type { CurrentAdvice, DayWindowScore, SprayIntelligence, SoilIntelligence, MowingWindowInfo, IrrigationAdvice, FertilizationAdvice } from "@/lib/evaluate";
import { scoreCurrentConditions, scoreDay, computeSprayIntelligence, computeSoilIntelligence, computeMowingWindow, computeIrrigationAdvice, computeFertilizationAdvice } from "@/lib/evaluate";
import { ALL_CROPS } from "@/data/crops";
import { describeWeatherCode } from "@/lib/weatherCode";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BRAND_GOLD, CONDITION_COLORS } from "@/lib/theme";

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

// Small caption above a section — Fraunces, normal case, warm-muted.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-display text-[13px] font-medium text-white/55">
      {children}
    </div>
  );
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
      <div className="text-[11px] font-medium text-white/45">{label}</div>
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
      <div className="px-3 text-[11px] font-medium text-white/45">Wind</div>
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
                fill={isN ? BRAND_GOLD : "rgba(255,255,255,0.32)"}
                fontSize={isN ? "9" : "7.5"}
                fontWeight={isN ? "700" : "400"}
                fontFamily="Inter Tight, system-ui, sans-serif"
              >
                {lbl}
              </text>
            );
          })}
          <g transform={`rotate(${direction})`}>
            <circle cx="0" cy="-25" r="4.5" fill={BRAND_GOLD} />
            <line x1="0" y1="-20" x2="0" y2="17" stroke={BRAND_GOLD} strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="0,27 -4.5,17 4.5,17" fill={BRAND_GOLD} />
          </g>
          <circle cx="0" cy="0" r="14" fill="rgba(20,17,11,0.85)" />
          <circle cx="0" cy="0" r="14" fill="none" stroke="rgba(214,162,74,0.25)" strokeWidth="1" />
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

const SCORE_COLOR = CONDITION_COLORS;

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
                ? { background: 'rgba(214,162,74,0.15)', color: BRAND_GOLD, border: '1px solid rgba(214,162,74,0.35)' }
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

// ── Hero verdict ────────────────────────────────────────────────────────────
// The answer, dominant. Primary activity = mowing for grass crops, else spraying.

interface HeroVerdictProps {
  title: string;
  cropName: string;
  score: ConditionScore;
  reason: string;
  legallyBlocked?: boolean;
  legalReason?: string;
}

function HeroVerdict({ title, cropName, score, reason, legallyBlocked, legalReason }: HeroVerdictProps) {
  const color = SCORE_COLOR[score];
  return (
    <div
      className="mt-4 rounded-2xl border px-4 py-4"
      style={{ background: `${color}14`, borderColor: `${color}38` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] text-white/55">
          {title} · <span className="text-white/40">{cropName}</span>
        </div>
        {legallyBlocked && (
          <div
            className="rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-tight"
            style={{ background: 'rgba(207,90,62,0.14)', color: '#cf5a3e', border: '1px solid rgba(207,90,62,0.3)' }}
            title={legalReason}
          >
            ⚖ Wettelijk verboden
          </div>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <div
          className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 16px 4px ${color}66` }}
        />
        <div className="font-display text-4xl font-semibold leading-none" style={{ color }}>
          {SCORE_LABEL[score]}
        </div>
      </div>
      <div className="mt-2 text-[13px] leading-snug text-white/55">{reason}</div>
    </div>
  );
}

// ── Secondary advice row ─────────────────────────────────────────────────────

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
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2 py-3 text-center">
      <div className="text-[11px] font-medium text-white/45">{title}</div>
      <div
        className="h-4 w-4 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 10px 2px ${color}55` }}
      />
      <div className="text-[13px] font-semibold" style={{ color }}>
        {SCORE_LABEL[score]}
      </div>
      <div className="text-[10px] leading-tight text-white/35">{reason}</div>
      {legallyBlocked && (
        <div
          className="mt-0.5 w-full rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-tight"
          style={{ background: 'rgba(207,90,62,0.12)', color: '#cf5a3e', border: '1px solid rgba(207,90,62,0.25)' }}
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
  const color = hasFrost ? CONDITION_COLORS.stop : CONDITION_COLORS.go;
  const label = hasFrost ? 'Risico' : 'Veilig';
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2 py-3 text-center">
      <div className="text-[11px] font-medium text-white/45">Vorst</div>
      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px 2px ${color}55` }} />
      <div className="text-[13px] font-semibold" style={{ color }}>{label}</div>
      <div className="text-[10px] leading-tight text-white/35">{reason}</div>
    </div>
  );
}

interface SecondaryAdviceProps {
  advice: CurrentAdvice;
}

function SecondaryAdvice({ advice }: SecondaryAdviceProps) {
  const isGrass = advice.mowing !== undefined && advice.mowingReason !== undefined;
  // The hero already owns the primary activity; show what's left here.
  const cards: React.ReactNode[] = [];
  if (isGrass) {
    cards.push(
      <AdviceCard
        key="spray"
        title="Spuiten"
        score={advice.spray}
        reason={advice.sprayReason}
        legallyBlocked={advice.sprayLegallyBlocked}
        legalReason={advice.sprayLegalReason}
      />,
    );
  }
  cards.push(<FrostCard key="frost" hasFrost={advice.frost} reason={advice.frostReason} />);
  if (!isGrass && advice.harvest !== undefined && advice.harvestReason !== undefined) {
    cards.push(<AdviceCard key="harvest" title="Oogsten" score={advice.harvest} reason={advice.harvestReason} />);
  }

  return (
    <div className={`mt-2 grid gap-2 ${cards.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {cards}
    </div>
  );
}

// ── Spray intelligence strip ─────────────────────────────────────────────────

const SCORE_DOT: Record<ConditionScore, string> = {
  go:      'bg-go',
  caution: 'bg-caution',
  stop:    'bg-stop',
};

function SprayIntelCard({ intel }: { intel: SprayIntelligence }) {
  const dtColor = SCORE_COLOR[intel.deltaTScore];
  return (
    <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
      <div className="mb-2 text-[11px] font-medium text-white/40">Spuitkwaliteit</div>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Delta-T */}
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: dtColor, boxShadow: `0 0 6px 1px ${dtColor}66` }}
          />
          <span className="text-[11px] text-white/60">
            ΔT{' '}
            <span className="font-semibold tabular-nums" style={{ color: dtColor }}>
              {intel.deltaT.toFixed(1)}°C
            </span>
          </span>
          <span className="text-[10px] text-white/30">
            {intel.deltaTScore === 'go' ? 'optimaal' : intel.deltaTScore === 'caution' ? 'te vochtig' : 'te droog'}
          </span>
        </div>

        <div className="h-3 w-px bg-white/10 hidden sm:block" />

        {/* Rain-free window */}
        <div className="flex items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full flex-shrink-0 ${intel.rainFreeHours >= 4 ? SCORE_DOT.go : intel.rainFreeHours >= 1 ? SCORE_DOT.caution : SCORE_DOT.stop}`}
          />
          <span className="text-[11px] text-white/60">
            Droog venster{' '}
            <span className="font-semibold tabular-nums text-white/80">
              {intel.rainFreeHours}u
            </span>
          </span>
        </div>

        {/* Dew risk */}
        {intel.dewRisk && (
          <>
            <div className="h-3 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1 text-[10px]" style={{ color: CONDITION_COLORS.caution }}>
              <span>💧</span>
              <span>Dauwrisico</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Soil intelligence card ───────────────────────────────────────────────────

const BLIGHT_COLOR: Record<'none' | 'low' | 'high', string> = {
  none:  CONDITION_COLORS.go,
  low:   CONDITION_COLORS.caution,
  high:  CONDITION_COLORS.stop,
};
const BLIGHT_LABEL: Record<'none' | 'low' | 'high', string> = {
  none:  'Laag',
  low:   'Matig',
  high:  'Hoog',
};

function SoilIntelCard({ intel }: { intel: SoilIntelligence }) {
  const trafColor = SCORE_COLOR[intel.trafficability];
  return (
    <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
      <div className="mb-2 text-[11px] font-medium text-white/40">Bodem</div>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Trafficability */}
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: trafColor, boxShadow: `0 0 6px 1px ${trafColor}66` }}
          />
          <span className="text-[11px] text-white/60">
            Berijdbaarheid{' '}
            <span className="font-semibold" style={{ color: trafColor }}>
              {intel.trafficability === 'go' ? 'OK' : intel.trafficability === 'caution' ? 'Marginaal' : 'Geblokkeerd'}
            </span>
          </span>
          <span className="text-[10px] text-white/30">{intel.trafficabilityReason.split(' (')[0]}</span>
        </div>

        {/* Ground frost */}
        {intel.groundFrost && (
          <>
            <div className="h-3 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1 text-[10px]" style={{ color: CONDITION_COLORS.stop }}>
              <span>🌡</span>
              <span>
                Grondvorst{intel.groundFrostTemp !== undefined ? ` ${intel.groundFrostTemp.toFixed(1)}°C` : ''}
              </span>
            </div>
          </>
        )}

        {/* Late blight pressure (potato only) */}
        {intel.lateBlightScore !== undefined && (
          <>
            <div className="h-3 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: BLIGHT_COLOR[intel.lateBlightScore],
                  boxShadow: `0 0 6px 1px ${BLIGHT_COLOR[intel.lateBlightScore]}66`,
                }}
              />
              <span className="text-[11px] text-white/60">
                Phytophthora{' '}
                <span className="font-semibold" style={{ color: BLIGHT_COLOR[intel.lateBlightScore] }}>
                  {BLIGHT_LABEL[intel.lateBlightScore]}
                </span>
              </span>
              {intel.lateBlightPressureHours !== undefined && (
                <span className="text-[10px] text-white/30">
                  {intel.lateBlightPressureHours}u druk
                </span>
              )}
            </div>
          </>
        )}

        {/* Septoria pressure (wheat only) */}
        {intel.septoriaScore !== undefined && (
          <>
            <div className="h-3 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: BLIGHT_COLOR[intel.septoriaScore],
                  boxShadow: `0 0 6px 1px ${BLIGHT_COLOR[intel.septoriaScore]}66`,
                }}
              />
              <span className="text-[11px] text-white/60">
                Septoria{' '}
                <span className="font-semibold" style={{ color: BLIGHT_COLOR[intel.septoriaScore] }}>
                  {BLIGHT_LABEL[intel.septoriaScore]}
                </span>
              </span>
              {intel.septoriaPressureHours !== undefined && (
                <span className="text-[10px] text-white/30">
                  {intel.septoriaPressureHours}u bladnat
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Irrigation advice card ───────────────────────────────────────────────────

function IrrigationCard({ advice }: { advice: IrrigationAdvice }) {
  const color = SCORE_COLOR[advice.score];
  return (
    <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
      <div className="mb-2 text-[11px] font-medium text-white/40">Beregening</div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color, boxShadow: `0 0 6px 1px ${color}66` }}
          />
          <span className="text-[11px] font-semibold" style={{ color }}>
            {advice.score === 'stop' ? 'Beregening aanbevolen' : advice.score === 'caution' ? 'Let op tekort' : 'Geen beregening nodig'}
          </span>
        </div>
        <div className="h-3 w-px bg-white/10 hidden sm:block" />
        <span className="text-[10px] text-white/40">
          7-daags ET0-tekort:{' '}
          <span className="tabular-nums text-white/60">{advice.weeklyDeficitMm} mm</span>
        </span>
      </div>
    </div>
  );
}

// ── Fertilization advice card ────────────────────────────────────────────────

function FertilizationCard({ advice }: { advice: FertilizationAdvice }) {
  const color = SCORE_COLOR[advice.score];
  return (
    <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
      <div className="mb-2 text-[11px] font-medium text-white/40">Bemesting</div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color, boxShadow: `0 0 6px 1px ${color}66` }}
          />
          <span className="text-[11px] font-semibold" style={{ color }}>
            {advice.score === 'go' ? 'Goed moment' : advice.score === 'caution' ? 'Let op' : 'Niet nu'}
          </span>
        </div>
        <div className="h-3 w-px bg-white/10 hidden sm:block" />
        <span className="text-[10px] text-white/40 leading-snug">{advice.reason}</span>
      </div>
      <div className="mt-1.5 text-[10px] text-white/30">
        Droog venster:{' '}
        <span className="tabular-nums text-white/50">{advice.rainFreeHours}u</span>
      </div>
    </div>
  );
}

// ── Crop input list card ──────────────────────────────────────────────────────

function InputListCard({ crop, diseaseActive }: { crop: CropConfig; diseaseActive: boolean }) {
  const [open, setOpen] = useState(false);

  const hasFertilizers = crop.acceptedFertilizers && crop.acceptedFertilizers.length > 0;
  const hasPesticides = crop.acceptedPesticides && crop.acceptedPesticides.length > 0;

  if (!hasFertilizers && !hasPesticides) return null;

  return (
    <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.025] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-white/40">Middelen &amp; meststoffen</span>
          {diseaseActive && (
            <span
              className="rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
              style={{ background: 'rgba(207,90,62,0.14)', color: '#cf5a3e', border: '1px solid rgba(207,90,62,0.3)' }}
            >
              Druk actief
            </span>
          )}
        </div>
        <span className={`text-[10px] text-white/30 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.05] px-3 pb-3 pt-2 space-y-3">
              {hasFertilizers && (
                <div>
                  <div className="mb-1.5 text-[10px] font-medium text-white/35">Meststoffen</div>
                  <div className="space-y-1.5">
                    {crop.acceptedFertilizers!.map((f, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-medium text-white/70">{f.name}</span>
                        <span className="text-[10px] text-white/35">{f.useCase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasFertilizers && hasPesticides && (
                <div className="border-t border-white/[0.05]" />
              )}

              {hasPesticides && (
                <div>
                  <div className="mb-1.5 text-[10px] font-medium text-white/35">Gewasbeschermingsmiddelen</div>
                  <div className="space-y-1.5">
                    {crop.acceptedPesticides!.map((p, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-medium text-white/70">{p.name}</span>
                        <span className="text-[10px] text-white/35">{p.useCase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <a
                href="https://toelatingen.ctgb.nl/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-[10px] text-white/25 hover:text-white/50 transition"
              >
                Officieel CTGB-toelatingenregister →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 7-day window row ────────────────────────────────────────────────────────

interface BestWindowRowProps {
  daily: DailyForecast[];
  scores: DayWindowScore[];
  mowingWindow?: MowingWindowInfo | null;
}

function BestWindowRow({ daily, scores, mowingWindow }: BestWindowRowProps) {
  const days = daily.map((d) =>
    new Date(`${d.date}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "short" }),
  );

  const hasMowing = scores.some((s) => s.mowing !== undefined);
  const hasHarvest = scores.some((s) => s.harvest !== undefined);

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-3">
      <SectionLabel>Spuitvenster — 7 dagen</SectionLabel>
      <div className="mt-2.5 grid grid-cols-7 gap-1">
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
                <div className="text-[8px] leading-none" style={{ color: CONDITION_COLORS.stop }} title="Wettelijk verboden">⚖</div>
              )}
            </div>
          );
        })}
      </div>

      {hasMowing && (
        <div className="mt-3">
          <SectionLabel>Maaivenster — 7 dagen</SectionLabel>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {scores.map((s, i) => {
              const score = s.mowing ?? 'stop';
              const color = SCORE_COLOR[score];
              const inWindow =
                mowingWindow?.windowStart !== null &&
                mowingWindow?.windowStart !== undefined &&
                i >= mowingWindow.windowStart &&
                i < mowingWindow.windowStart + (mowingWindow.windowDates.length || 0);
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="text-[10px] text-white/30">{days[i]}</div>
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: inWindow ? `0 0 8px 3px ${color}88` : `0 0 6px 1px ${color}66`,
                      outline: inWindow ? `1px solid ${color}` : undefined,
                      outlineOffset: inWindow ? '2px' : undefined,
                    }}
                  />
                </div>
              );
            })}
          </div>
          {mowingWindow && (
            <div className="mt-1.5 text-[10px] text-white/35">
              {mowingWindow.windowStart !== null
                ? `Beste venster: ${mowingWindow.windowDates
                    .map((d) =>
                      new Date(`${d}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" }),
                    )
                    .join(' – ')}`
                : 'Geen droog maaivenster deze week'}
            </div>
          )}
        </div>
      )}

      {hasHarvest && (
        <div className="mt-3">
          <SectionLabel>Oogstvenster — 7 dagen</SectionLabel>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {scores.map((s, i) => {
              const score = s.harvest ?? 'stop';
              const color = SCORE_COLOR[score];
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
      )}
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
      <SectionLabel>Temperatuur — 7 dagen</SectionLabel>
      <svg
        viewBox={`0 0 ${W} ${H_TOTAL}`}
        preserveAspectRatio="none"
        className="mt-2 h-20 w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="fc-spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND_GOLD} stopOpacity="0.28" />
            <stop offset="100%" stopColor={BRAND_GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#fc-spark-grad)" />
        <path d={line} fill="none" stroke={BRAND_GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.8} fill={BRAND_GOLD} />
        ))}
        <line x1="0" y1={H_TEMP + H_GAP / 2} x2={W} y2={H_TEMP + H_GAP / 2} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        {rains.map((r, i) => {
          if (r < 0.1) return null;
          const x = (i / (rains.length - 1)) * W;
          const barH = (r / maxRain) * H_RAIN;
          return (
            <rect key={i} x={x - 3} y={H_TOTAL - barH} width={6} height={barH} fill="rgba(214,162,74,0.5)" rx={1} />
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
  const [showDetails, setShowDetails] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );
  const saveInputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  const current = forecast?.current;
  const weather = current ? describeWeatherCode(current.weatherCode) : null;

  const advice = current ? scoreCurrentConditions(current, selectedCrop) : null;
  const windowScores: DayWindowScore[] =
    forecast?.daily.map((d) => scoreDay(d, selectedCrop)) ?? [];
  const sprayIntel = forecast?.hourly ? computeSprayIntelligence(forecast.hourly) : null;
  const soilIntel = forecast?.hourly ? computeSoilIntelligence(forecast.hourly, selectedCrop) : null;
  const mowingWindow = forecast?.daily ? computeMowingWindow(forecast.daily, selectedCrop) : null;
  const irrigationAdvice = forecast?.daily ? computeIrrigationAdvice(forecast.daily) : null;
  const showIrrigation = irrigationAdvice && !selectedCrop.mowing;
  const fertilizationAdvice = (forecast?.hourly && forecast?.daily)
    ? computeFertilizationAdvice(forecast.hourly, forecast.daily, selectedCrop)
    : null;

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

  // The hero owns the crop's primary decision: mowing for grass, else spraying.
  const heroIsMowing =
    advice?.mowing !== undefined && advice?.mowingReason !== undefined;

  return (
    <AnimatePresence>
      <motion.div
        key="condition-panel"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80) onClose();
        }}
        className="glass pointer-events-auto w-full rounded-t-2xl rounded-b-none text-white md:w-[min(92vw,360px)] md:rounded-2xl lg:w-[min(92vw,420px)]"
      >
        {/* Mobile drag handle — touch target for drag-to-dismiss */}
        <div
          className="flex justify-center py-2 cursor-grab active:cursor-grabbing touch-none md:hidden"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Scrollable content area */}
        <div className="max-h-[80vh] overflow-y-auto px-4 pb-4 pb-safe md:max-h-[85vh] md:p-4 md:pt-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-display text-[12px] font-medium text-brand">
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
          <div className="mt-3 animate-pulse space-y-3">
            <div className="h-24 rounded-2xl bg-white/[0.06]" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-20 rounded-xl bg-white/[0.04]" />
              <div className="h-20 rounded-xl bg-white/[0.04]" />
            </div>
            <div className="h-12 rounded-xl bg-white/[0.04]" />
            <div className="grid grid-cols-7 gap-1 pt-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-white/[0.04]" />
              ))}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="mt-3 rounded-xl border border-stop/30 bg-stop/10 px-3 py-2 text-sm text-stop">
            {error}
          </div>
        )}

        {current && !loading && !error && advice && (
          <>
            {/* The answer, dominant: hero verdict for the primary activity */}
            <HeroVerdict
              title={heroIsMowing ? "Maaien" : "Spuiten"}
              cropName={selectedCrop.name}
              score={heroIsMowing ? advice.mowing! : advice.spray}
              reason={heroIsMowing ? advice.mowingReason! : advice.sprayReason}
              legallyBlocked={heroIsMowing ? undefined : advice.sprayLegallyBlocked}
              legalReason={heroIsMowing ? undefined : advice.sprayLegalReason}
            />

            {/* Supporting decisions, de-emphasized */}
            <SecondaryAdvice advice={advice} />

            {/* Hourly spray intelligence — Delta-T, rain-free window, dew risk */}
            {sprayIntel && <SprayIntelCard intel={sprayIntel} />}

            {/* Irrigation advice — ET0 deficit, arable crops only */}
            {showIrrigation && <IrrigationCard advice={irrigationAdvice} />}

            {/* Soil intelligence — trafficability, ground frost, disease pressure */}
            {soilIntel && <SoilIntelCard intel={soilIntel} />}

            {/* Fertilization timing advice */}
            {fertilizationAdvice && <FertilizationCard advice={fertilizationAdvice} />}

            {/* Crop input reference — fertilizers + pesticides, collapsible */}
            <InputListCard
              crop={selectedCrop}
              diseaseActive={
                (soilIntel?.lateBlightScore === 'high' || soilIntel?.lateBlightScore === 'low') ||
                (soilIntel?.septoriaScore === 'high' || soilIntel?.septoriaScore === 'low')
              }
            />

            {/* The planning horizon: 7-day best window dots */}
            {forecast.daily.length > 0 && windowScores.length > 0 && (
              <BestWindowRow
                daily={forecast.daily}
                scores={windowScores}
                mowingWindow={mowingWindow}
              />
            )}

            {/* Compact current weather line */}
            <div className="mt-4 flex items-center gap-3 border-t border-white/[0.06] pt-3">
              <span className="text-3xl">{weather?.glyph}</span>
              <div>
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={current.temperature} decimals={1} />
                  <span className="ml-0.5 text-lg font-medium text-white/50">°C</span>
                </div>
                <div className="text-xs text-white/50">{weather?.label}</div>
              </div>
            </div>

            {/* Raw metrics — supporting data, collapsible */}
            <div className="mt-3">
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg px-1 py-1 font-display text-[13px] font-medium text-white/50 transition hover:text-white/80"
              >
                <span>Details</span>
                <span className={`transition-transform ${showDetails ? "rotate-180" : ""}`}>▾</span>
              </button>
              <AnimatePresence initial={false}>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <WindCompass speed={current.windSpeed} direction={current.windDirection} />
                      <Metric label="Neerslag" value={current.precipitation} unit="mm" decimals={1} />
                      <Metric label="Bodemtemp." value={current.soilTemperature} unit="°C" decimals={1} />
                      <Metric label="Vochtigheid" value={current.humidity} unit="%" />
                      {current.soilMoisture !== undefined && (
                        <Metric label="Bodemvocht" value={current.soilMoisture * 100} unit="%" decimals={1} />
                      )}
                    </div>
                    {/* 7-day temperature sparkline */}
                    {forecast.daily.length > 0 && (
                      <WeekSparkline daily={forecast.daily} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-3 text-[11px] text-white/30">
              Bron: Open-Meteo ·{" "}
              {new Date(current.time).toLocaleString("nl-NL")}
            </div>
          </>
        )}
        </div>{/* end scrollable content */}
      </motion.div>
    </AnimatePresence>
  );
}
