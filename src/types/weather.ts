// Shared weather data shapes for Farmcast.

export interface LatLon {
  lat: number;
  lon: number;
}

/** A named, pickable location on the map. */
export interface NamedLocation extends LatLon {
  name: string;
}

/** Current-conditions snapshot for one point, normalised to NL-friendly units. */
export interface CurrentConditions {
  /** Air temperature, °C */
  temperature: number;
  /** Wind speed, km/h */
  windSpeed: number;
  /** Wind direction, degrees (meteorological) */
  windDirection: number;
  /** Precipitation in the last interval, mm */
  precipitation: number;
  /** Soil temperature at 6cm, °C (undefined if unavailable) */
  soilTemperature?: number;
  /** Soil moisture 3-9cm, m³/m³ (undefined if unavailable) */
  soilMoisture?: number;
  /** Relative humidity, % */
  humidity: number;
  /** WMO weather code */
  weatherCode: number;
  /** ISO time this snapshot is valid for */
  time: string;
}

/** One day in the 7-day daily forecast. */
export interface DailyForecast {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  tempMax: number;
  tempMin: number;
  /** Total precipitation, mm */
  precipitation: number;
  weatherCode: number;
}

/** Everything the glass panel needs for one location. */
export interface PointForecast {
  location: LatLon;
  current: CurrentConditions;
  daily: DailyForecast[];
}

export type OverlayLayer = 'temperature' | 'wind' | 'rain' | 'none';

/** One sampled point in the country-wide condition grid. */
export interface GridPoint extends LatLon {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  /** Eastward wind component, km/h */
  windU: number;
  /** Northward wind component, km/h */
  windV: number;
  precipitation: number;
  soilTemperature?: number;
}

/** One radar frame from the RainViewer API. */
export interface RadarFrame {
  time: number;
  path: string;
}
