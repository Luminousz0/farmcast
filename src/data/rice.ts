import type { CropConfig } from '@/types/crop';

export const rice: CropConfig = {
  id: 'rice',
  name: 'Rijst',
  region: 'global',
  pesticideClass: 'II',
  spray: {
    maxWindSpeed: 15,     // km/h — spray drift at higher speeds reduces efficacy
    maxPrecipitation: 1,  // mm — paddies are wet but foliar spray washes off
    minTemp: 18,          // °C — poor uptake below tropical growing range
    maxTemp: 38,          // °C — spray evaporates too quickly; heat stress on crop
  },
  frost: {
    alertBelowTemp: 10,   // °C — chilling injury; tropical crop dies below ~8°C
    alertBelowSoilTemp: 14,
  },
  harvest: {
    minTemp: 20,          // °C — grain drying too slow in cold
    maxTemp: 40,          // °C — combine operators and grain quality
    maxPrecipitation: 8,  // mm — wet grain = mould; machinery sinks in paddy mud
    maxWindSpeed: 40,     // km/h — header loss risk in wind
  },
  fertilization: {
    minUptakeTemp: 18,    // °C — N mineralisation stalls below this in tropical soils
    maxWindSpeed: 20,
    minRainFreeHours: 24, // shorter than NL crops — tropical showers are brief
    maxSoilMoisture: 0.55,
  },
  acceptedFertilizers: [
    { name: 'Ureum (46-0-0)', useCase: 'Hoofdgift stikstof — uitstoeling en gewasgroei' },
    { name: 'DAP (18-46-0)', useCase: 'Fosfaatgift bij aanplant — wortels en uitstoeling' },
    { name: 'KCl (muriate of potash)', useCase: 'Kaliumgift — opbrengst en kwaliteit korrelvulling' },
    { name: 'Ammoniumsulfaat (21-0-0)', useCase: 'Rijst benut NH₄⁺ goed in waterverzadigde paddy-bodem' },
    { name: 'NPK 15-15-15', useCase: 'Basisgift — complete voeding op arme tropische gronden' },
  ],
  acceptedPesticides: [
    { name: 'Tricyclazool / Isoprothiolaan', useCase: 'Rijstblast (Pyricularia oryzae) — preventief systeem-fungicide' },
    { name: 'Propiconazool', useCase: 'Aarblast en bruine vlek — curatief fungicide' },
    { name: 'Bispyribac-natrium', useCase: 'Selectief herbicide — grasachtig onkruid in paddy\'s' },
    { name: 'Pretilachloor', useCase: 'Pre-emergence herbicide — breedbladig onkruid rijstpaddy' },
    { name: 'Imidacloprid / Carbofuraan', useCase: 'Stengelboorder, gal-mug — stelselmatig insecticide' },
  ],
};
