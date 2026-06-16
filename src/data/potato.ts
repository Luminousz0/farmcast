import type { CropConfig } from '@/types/crop';

export const potato: CropConfig = {
  id: 'potato',
  name: 'Aardappel',
  pesticideClass: 'II',
  spray: {
    maxWindSpeed: 12,      // km/h — class II limit; phytophthora fungicides very common
    maxPrecipitation: 0.5, // mm
    minTemp: 10,           // °C — stomatal uptake drops sharply below this
    maxTemp: 25,           // °C — risk of phytotoxicity in heat
  },
  frost: {
    alertBelowTemp: 2,     // °C — young shoots frost-sensitive
    alertBelowSoilTemp: 6, // °C — tuber growth stalls; higher threshold than maize
  },
  harvest: {
    minTemp: 8,            // °C — tuber skin sets poorly in cold
    maxTemp: 30,           // °C
    maxPrecipitation: 8,   // mm — wet soil damages skin, increases bruising
    maxWindSpeed: 40,      // km/h — harvester/elevator limit
  },
};
