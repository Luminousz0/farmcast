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
  /** Max wind speed km/h — used by the rules engine for daily window scoring */
  windSpeedMax?: number;
  /** FAO-56 Penman-Monteith reference evapotranspiration, mm/day */
  et0?: number;
}

/** One hour in the 48-hour hourly forecast (next 24h returned by the client). */
export interface HourlyForecast {
  /** ISO datetime string (YYYY-MM-DDTHH:00) */
  time: string;
  temperature: number;
  humidity: number;
  dewPoint: number;
  precipitation: number;
  windSpeed: number;
  /** Surface soil temperature (0 cm), °C — ground frost indicator */
  soilTemperature0cm?: number;
  /** Soil moisture 0–1 cm, m³/m³ — trafficability proxy */
  soilMoisture0to1cm?: number;
}

/** Everything the glass panel needs for one location. */
export interface PointForecast {
  location: LatLon;
  current: CurrentConditions;
  daily: DailyForecast[];
  /** Next 24 hours of hourly data, starting from the current hour. */
  hourly: HourlyForecast[];
}

/** Axis-aligned bounding box in lat/lon degrees. */
export interface Bbox {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

/** One sampled point in the country-wide condition grid. */
export interface GridPoint extends LatLon {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  soilTemperature?: number;
}

