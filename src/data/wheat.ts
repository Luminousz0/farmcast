import type { CropConfig } from '@/types/crop';

export const wheat: CropConfig = {
  id: 'wheat',
  name: 'Tarwe',
  pesticideClass: 'II',
  spray: {
    maxWindSpeed: 12,      // km/h
    maxPrecipitation: 0.5, // mm
    minTemp: 8,            // °C
    maxTemp: 25,           // °C — fungicide uptake impaired in heat
  },
  frost: {
    alertBelowTemp: -3,    // °C — winter wheat is frost-hardy; alert only at hard frost
  },
  harvest: {
    minTemp: 15,           // °C — grain must be warm enough to dry to <14% moisture
    maxTemp: 38,           // °C
    maxPrecipitation: 3,   // mm — grain quality degrades fast when wet; mould risk
    maxWindSpeed: 50,      // km/h — combine header limit; grain shedding above this
  },
  septoria: {
    minTempC: 4,           // °C — Zymoseptoria tritici inactive below 4°C
    maxTempC: 25,          // °C — spore germination slows above 25°C
    minRhPct: 85,          // % — leaf wetness threshold
    pressureHoursHigh: 10, // h — ≥ 10 leaf-wetness hours in 24h = high risk
    pressureHoursLow: 5,   // h — ≥ 5h = low risk
  },
  fertilization: {
    minUptakeTemp: 5,      // °C — winter wheat starts active uptake from ~5°C (spring)
    maxWindSpeed: 20,      // km/h
    minRainFreeHours: 48,  // h
    maxSoilMoisture: 0.38, // m³/m³
  },
  acceptedFertilizers: [
    { name: 'KAS (Kalkammonsalpeter)', useCase: 'Hoofd N-gift — 3 giften: feb, mrt, mei' },
    { name: 'Urean (vloeibare ureum)', useCase: 'Vloeibare N — bijbemesting spuiten + strooien' },
    { name: 'Kali 60 (K₂SO₄)', useCase: 'K-gift — basisgift herfst of vroeg voorjaar' },
    { name: 'Tripel Superfosfaat (TSP)', useCase: 'P-gift — basisgift bij inzaai' },
    { name: 'MgSO₄ (kieseriet)', useCase: 'Magnesium — correctie op lichte zandgronden' },
  ],
  acceptedPesticides: [
    { name: 'Azoxystrobine + Propiconazool', useCase: 'Septoria — preventieve breedwerkende gift (DC 31–39)' },
    { name: 'Tebuconazool', useCase: 'Septoria, Fusarium — curatief tot DC 59' },
    { name: 'Epoxiconazool + Kresoxim-methyl', useCase: 'Meeldauw, roest — preventief najaar/vroeg voorjaar' },
    { name: 'Pyrethroïde (bijv. cypermethrin)', useCase: 'Bladluis, graanmug — vroeg zomer, let op bijveiligheid' },
    { name: 'Chlormequat', useCase: 'Groeiregulatie — legering voorkomen (DC 25–31)' },
  ],
};
