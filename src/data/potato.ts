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
  lateBlight: {
    minTempC: 10,              // Smith Period: Phytophthora infestans active above 10°C
    minRhPct: 90,              // Smith Period: RH ≥ 90% needed for spore germination
    pressureHoursThreshold: 11, // Smith Period: ≥ 11 qualifying hours = pressure day
  },
  fertilization: {
    minUptakeTemp: 8,      // °C — tuber growth and N uptake stall below 8°C
    maxWindSpeed: 20,      // km/h
    minRainFreeHours: 48,  // h
    maxSoilMoisture: 0.38, // m³/m³
  },
  acceptedFertilizers: [
    { name: 'KAS (Kalkammonsalpeter)', useCase: 'Hoofd-N gift — voor of bij poten' },
    { name: 'Patentkali (MgSO₄ + K₂SO₄)', useCase: 'K + Mg — verbetert knolopbouw en kwaliteit' },
    { name: 'Tripel Superfosfaat (TSP)', useCase: 'P — basisgift bij grondbewerking' },
    { name: 'Ammoniumsulfaat', useCase: 'N + S — bijbemesting, verlaagt pH lokaal' },
    { name: 'NP/NPK vloeibaar', useCase: 'Startgift via rij — snel beschikbaar' },
  ],
  acceptedPesticides: [
    { name: 'Metalaxyl-M + Mancozeb', useCase: 'Phytophthora — preventieve basisgift (7-daags schema)' },
    { name: 'Cymoxanil', useCase: 'Phytophthora — curatief na infectieperiode (24-48u venster)' },
    { name: 'Fluazinam', useCase: 'Phytophthora — contactmiddel, hoge regenvastheid' },
    { name: 'Deltamethrin (pyrethroïde)', useCase: 'Colorado kever — topje aanslag bestrijding' },
    { name: 'Dimethoaat', useCase: 'Bladluis / virusziekten — systemisch, vroeg seizoen' },
  ],
};
