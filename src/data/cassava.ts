import type { CropConfig } from '@/types/crop';

export const cassava: CropConfig = {
  id: 'cassava',
  name: 'Cassave',
  region: 'global',
  pesticideClass: 'II',
  spray: {
    maxWindSpeed: 12,
    maxPrecipitation: 1,
    minTemp: 18,
    maxTemp: 38,          // °C — cassave verdraagt hoge temp, maar spray vervliegt
  },
  frost: {
    alertBelowTemp: 12,   // °C — cassaveblad sterft al bij <10°C; tropische oorsprong
    alertBelowSoilTemp: 15,
  },
  harvest: {
    minTemp: 18,
    maxTemp: 42,          // °C — handmatige oogst, geen machinegrens
    maxPrecipitation: 15, // mm — wortels rottten snel na oogst in nat weer
    maxWindSpeed: 40,
  },
  fertilization: {
    minUptakeTemp: 18,
    maxWindSpeed: 20,
    minRainFreeHours: 24,
    maxSoilMoisture: 0.45,
  },
  acceptedFertilizers: [
    { name: 'Ureum (46-0-0)', useCase: 'Stikstofgift 2–3 maanden na aanplant voor bladgroei' },
    { name: 'Superfosfaat (TSP)', useCase: 'Fosfaatgift bij aanplant — wortels en vroege groei' },
    { name: 'KCl (muriate of potash)', useCase: 'Hoog K-gehalte noodzakelijk voor wortelopbrengst (cassave verbruikt veel K)' },
    { name: 'Dolomiet', useCase: 'Kalk voor pH-correctie + Mg-voorziening op zure Afrikaanse bodems' },
    { name: 'NPK 10-10-20', useCase: 'Complete gift op arme zandbodems — hoog K voor zetmeelaccumulatie' },
  ],
  acceptedPesticides: [
    { name: 'Thiamethoxam (zaadbehandeling)', useCase: 'Wittevlieg (Bemisia tabaci) — vector voor cassavemozaïekvirus (CMD)' },
    { name: 'Deltamethrin / Bifenthrin', useCase: 'Cassavemijt (Mononychellus tanajoa) — contactinsecticide bij hoge druk' },
    { name: 'Cymoxanil + Mancozeb', useCase: 'Phytophthora (bruinrot / witrot wortels) — preventief fungicide' },
    { name: 'Acetamiprid', useCase: 'Tripsen en wittevlieg preventief — systemisch' },
    { name: 'Chlorpyrifos (bodembehandeling)', useCase: 'Termietenvraat aan jonge stekken — grondinsecticide' },
  ],
};
