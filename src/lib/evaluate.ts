import type { ConditionScore, CropConfig } from '@/types/crop';
import type { CurrentConditions, DailyForecast } from '@/types/weather';
import { CTGB_LEGAL_WIND_KMH } from '@/data/sprayLegal';

export interface CurrentAdvice {
  spray: ConditionScore;
  sprayReason: string;
  /** True when current wind exceeds the ctgb.nl legal limit for this crop's pesticide class */
  sprayLegallyBlocked: boolean;
  sprayLegalReason: string;
  frost: boolean;
  frostReason: string;
  harvest: ConditionScore;
  harvestReason: string;
}

export interface DayWindowScore {
  spray: ConditionScore;
  /** True when daily max wind exceeds the legal limit */
  sprayLegallyBlocked: boolean;
  harvest: ConditionScore;
  frost: boolean;
}

/** Score current conditions for the advice strip (uses full current data incl. wind). */
export function scoreCurrentConditions(
  current: CurrentConditions,
  crop: CropConfig,
): CurrentAdvice {
  const legalMaxWind = CTGB_LEGAL_WIND_KMH[crop.pesticideClass];

  // --- Legal spray check ---
  const sprayLegallyBlocked = current.windSpeed > legalMaxWind;
  const sprayLegalReason = sprayLegallyBlocked
    ? `Wettelijk verboden — wind ${Math.round(current.windSpeed)} km/u (max ${legalMaxWind} km/u klasse ${crop.pesticideClass})`
    : `Klasse ${crop.pesticideClass} — max ${legalMaxWind} km/u`;

  // --- Spray (agronomic) ---
  let spray: ConditionScore = 'go';
  let sprayReason = 'Condities gunstig';

  if (current.precipitation > crop.spray.maxPrecipitation) {
    spray = 'stop';
    sprayReason = `Neerslag te hoog (${current.precipitation.toFixed(1)} mm)`;
  } else if (current.windSpeed > crop.spray.maxWindSpeed) {
    spray = 'stop';
    sprayReason = `Wind te sterk (${Math.round(current.windSpeed)} km/u)`;
  } else if (current.temperature < crop.spray.minTemp) {
    spray = 'stop';
    sprayReason = `Te koud voor opname (${current.temperature.toFixed(1)}°C)`;
  } else if (current.temperature > crop.spray.maxTemp) {
    spray = 'caution';
    sprayReason = `Warm — verdampingsrisico`;
  } else if (current.windSpeed > crop.spray.maxWindSpeed * 0.75) {
    spray = 'caution';
    sprayReason = `Wind aan de hoge kant (${Math.round(current.windSpeed)} km/u)`;
  }

  // --- Frost ---
  const soilFrost =
    current.soilTemperature !== undefined &&
    crop.frost.alertBelowSoilTemp !== undefined &&
    current.soilTemperature <= crop.frost.alertBelowSoilTemp;

  const frost = current.temperature <= crop.frost.alertBelowTemp || soilFrost;
  const frostReason = frost
    ? soilFrost
      ? `Bodemtemp. laag (${current.soilTemperature?.toFixed(1)}°C)`
      : `Vorstrisico (${current.temperature.toFixed(1)}°C)`
    : 'Geen vorstrisico';

  // --- Harvest ---
  let harvest: ConditionScore = 'go';
  let harvestReason = 'Goed oogstmoment';

  if (current.windSpeed > crop.harvest.maxWindSpeed) {
    harvest = 'stop';
    harvestReason = `Wind te sterk voor machines`;
  } else if (current.precipitation > crop.harvest.maxPrecipitation) {
    harvest = 'stop';
    harvestReason = `Veld te nat (${current.precipitation.toFixed(1)} mm)`;
  } else if (current.temperature < crop.harvest.minTemp) {
    harvest = 'caution';
    harvestReason = `Koud — vochtgehalte hoog`;
  } else if (current.temperature > crop.harvest.maxTemp) {
    harvest = 'caution';
    harvestReason = `Erg warm`;
  } else if (current.precipitation > crop.harvest.maxPrecipitation * 0.4) {
    harvest = 'caution';
    harvestReason = `Enige neerslag (${current.precipitation.toFixed(1)} mm)`;
  }

  return { spray, sprayReason, sprayLegallyBlocked, sprayLegalReason, frost, frostReason, harvest, harvestReason };
}

/** Score a single daily forecast day for the 7-day best-window row. */
export function scoreDay(day: DailyForecast, crop: CropConfig): DayWindowScore {
  const legalMaxWind = CTGB_LEGAL_WIND_KMH[crop.pesticideClass];
  const sprayLegallyBlocked = day.windSpeedMax !== undefined && day.windSpeedMax > legalMaxWind;

  // --- Spray ---
  let spray: ConditionScore = 'go';

  if (
    day.windSpeedMax !== undefined &&
    day.windSpeedMax > crop.spray.maxWindSpeed
  ) {
    spray = 'stop';
  } else if (day.precipitation > crop.spray.maxPrecipitation * 3) {
    spray = 'stop';
  } else if (
    day.tempMax < crop.spray.minTemp ||
    day.precipitation > crop.spray.maxPrecipitation
  ) {
    spray = 'caution';
  } else if (
    day.windSpeedMax !== undefined &&
    day.windSpeedMax > crop.spray.maxWindSpeed * 0.75
  ) {
    spray = 'caution';
  } else if (day.tempMax > crop.spray.maxTemp) {
    spray = 'caution';
  }

  // --- Harvest ---
  let harvest: ConditionScore = 'go';

  if (day.precipitation > crop.harvest.maxPrecipitation) {
    harvest = 'stop';
  } else if (
    day.windSpeedMax !== undefined &&
    day.windSpeedMax > crop.harvest.maxWindSpeed
  ) {
    harvest = 'stop';
  } else if (
    day.tempMax < crop.harvest.minTemp ||
    day.precipitation > crop.harvest.maxPrecipitation * 0.4
  ) {
    harvest = 'caution';
  } else if (day.tempMax > crop.harvest.maxTemp) {
    harvest = 'caution';
  }

  // --- Frost ---
  const frost = day.tempMin <= crop.frost.alertBelowTemp;

  return { spray, sprayLegallyBlocked, harvest, frost };
}
