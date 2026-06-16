export type ConditionScore = 'go' | 'caution' | 'stop';

/** ctgb.nl pesticide drift class — determines legal max wind speed for outdoor spraying */
export type PesticideClass = 'I' | 'II' | 'III';

export interface SprayThresholds {
  /** Max wind speed km/h */
  maxWindSpeed: number;
  /** Max precipitation mm — above this spray washes off */
  maxPrecipitation: number;
  /** Min air temp °C — below this uptake is poor */
  minTemp: number;
  /** Max air temp °C — above this evaporation risk */
  maxTemp: number;
}

export interface FrostThresholds {
  /** Air temp °C at or below which frost alert fires */
  alertBelowTemp: number;
  /** Soil temp °C at or below which frost alert fires (optional) */
  alertBelowSoilTemp?: number;
}

export interface HarvestThresholds {
  minTemp: number;
  maxTemp: number;
  /** Max precipitation mm — above this field is too wet */
  maxPrecipitation: number;
  /** Max wind speed km/h — structural limit for harvest machinery */
  maxWindSpeed: number;
}

export interface MowingThresholds {
  /** Max precipitation mm/day — wet field risks compaction and poor wilting */
  maxPrecipitation: number;
  /** Max wind speed km/h */
  maxWindSpeed: number;
  /** Min temp °C — grass quality and drying poor below this */
  minTemp: number;
  /** Number of consecutive good days required for a mowing window */
  dryDaysRequired: number;
}

/** Smith Period late-blight pressure configuration (potato-specific). */
export interface LateBlightConfig {
  /** Min air temperature °C for a pressure hour (Smith Period: 10°C) */
  minTempC: number;
  /** Min relative humidity % for a pressure hour (Smith Period: 90%) */
  minRhPct: number;
  /** Hours per 24h window that trigger a pressure day (Smith Period: 11h) */
  pressureHoursThreshold: number;
}

export interface CropConfig {
  id: string;
  name: string;
  /** ctgb.nl drift class — used to look up the legal spray wind limit */
  pesticideClass: PesticideClass;
  spray: SprayThresholds;
  frost: FrostThresholds;
  /** Not present on dairy/grassland crops — use mowing instead */
  harvest?: HarvestThresholds;
  /** Present on dairy/grassland crops — drives mowing window */
  mowing?: MowingThresholds;
  /** Present only on crops susceptible to late blight (Phytophthora infestans) */
  lateBlight?: LateBlightConfig;
}
