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

export interface CropConfig {
  id: string;
  name: string;
  /** ctgb.nl drift class — used to look up the legal spray wind limit */
  pesticideClass: PesticideClass;
  spray: SprayThresholds;
  frost: FrostThresholds;
  harvest: HarvestThresholds;
}
