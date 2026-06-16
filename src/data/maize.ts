import type { CropConfig } from '@/types/crop';

export const maize: CropConfig = {
  id: 'maize',
  name: 'Maïs',
  pesticideClass: 'II',
  spray: {
    maxWindSpeed: 12,      // km/h — ctgb.nl class II limit for most maize pesticides
    maxPrecipitation: 0.5, // mm — rain washes off spray within the hour
    minTemp: 8,            // °C — poor stomatal uptake below this
    maxTemp: 28,           // °C — spray evaporates too quickly above this
  },
  frost: {
    alertBelowTemp: 2,     // °C — frost damage risk to young maize
    alertBelowSoilTemp: 5, // °C — germination stalls below 5°C
  },
  harvest: {
    minTemp: 10,           // °C — grain moisture too high in cold
    maxTemp: 38,           // °C — heat stress on machinery operators
    maxPrecipitation: 5,   // mm — combine sinks / grain mould risk
    maxWindSpeed: 45,      // km/h — structural limit for combine headers
  },
};
