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
  fertilization: {
    minUptakeTemp: 8,      // °C — maize N uptake poor below 8°C
    maxWindSpeed: 20,      // km/h — pellet/granule spread accuracy limit
    minRainFreeHours: 48,  // h — fertilizer must not wash off for 2 days
    maxSoilMoisture: 0.38, // m³/m³ — saturated soil → machinery compaction
  },
  acceptedFertilizers: [
    { name: 'KAS (Kalkammonsalpeter)', useCase: 'Breedwerkende N — standaardgift voorjaar' },
    { name: 'Urean (vloeibare ureum)', useCase: 'Vloeibare N — bijbemesting na opkomst' },
    { name: 'Drijfmest (rund/varken)', useCase: 'N + P + K — basisgift vóór inzaai (feb–apr)' },
    { name: 'Digestaat', useCase: 'N-rijke organische gift — goed benutte N' },
    { name: 'NPK 27-5-5', useCase: 'Volledige gift bij zaai — rijen- of broodbemesting' },
  ],
  acceptedPesticides: [
    { name: 'Pyrethroïde (bijv. deltamethrin)', useCase: 'Bladluizen, trips — niet bij bijactiviteit' },
    { name: 'Lambdacyhalothrin', useCase: 'Maïswortelkever (Diabrotica) — zaadbehandeling' },
    { name: 'Tebuconazool', useCase: 'Stengelrot (Fusarium) — preventief bij hoge druk' },
    { name: 'S-metolachloor + terbuthylazin', useCase: 'Onkruid — herbicide vroeg na opkomst' },
  ],
};
