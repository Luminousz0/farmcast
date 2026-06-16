import type { CropConfig } from '@/types/crop';

export const soy: CropConfig = {
  id: 'soy',
  name: 'Soja',
  region: 'global',
  pesticideClass: 'II',
  spray: {
    maxWindSpeed: 12,
    maxPrecipitation: 0.5,
    minTemp: 10,
    maxTemp: 30,
  },
  frost: {
    alertBelowTemp: 2,    // °C — young soy plants frost-sensitive; mature crop tolerates light frost
    alertBelowSoilTemp: 8,
  },
  harvest: {
    minTemp: 12,          // °C — grain moisture too high to reach 13% in cold
    maxTemp: 38,
    maxPrecipitation: 3,  // mm — wet soy grain = mould; field mud
    maxWindSpeed: 45,
  },
  fertilization: {
    minUptakeTemp: 10,    // °C — Bradyrhizobium N-fixation slows below 10°C
    maxWindSpeed: 20,
    minRainFreeHours: 36,
    maxSoilMoisture: 0.40,
  },
  acceptedFertilizers: [
    { name: 'Rhizobium-inoculant (Bradyrhizobium japonicum)', useCase: 'Stikstoffixatie via knolletjesbacteriën — vervangt 200+ kg N/ha kunstmest' },
    { name: 'Superfosfaat (TSP 0-46-0)', useCase: 'Fosfaatgift bij zaai — wortels en nodulatie' },
    { name: 'KCl (60% K₂O)', useCase: 'Kaliumgift — opbrengst en proteïnegehalte' },
    { name: 'Micro-nutriënten (Mn, Zn, B)', useCase: 'Tekorten op zure tropische grond beperken zaadopbrengst' },
    { name: 'Zwavel (gips / elementaire S)', useCase: 'Eiwitkwaliteit; S-fixatie bij lage pH-gronden in Cerrado' },
  ],
  acceptedPesticides: [
    { name: 'Glyfosaat', useCase: 'Herbicide voor onkruid in herbicidetolerant (HT) soja' },
    { name: 'Azoxystrobine + Tebuconazool', useCase: 'Phytophthora / Sojabrandvlek — curatief + preventief fungicide' },
    { name: 'Chlorothalonil', useCase: 'Cercospora bladvlek, antracnose — bredewerkend fungicide' },
    { name: 'Lambda-cyhalothrin', useCase: 'Spintmijt, rups, peulboorder — contactinsecticide' },
    { name: 'Imazethapyr', useCase: 'Post-emergence herbicide — breedbladig onkruid en grassen' },
  ],
};
