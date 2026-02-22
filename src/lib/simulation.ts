// ─── Simulation Parameters ────────────────────────────────────────────────────
export interface SimulationParams {
    co2EmissionRate: number;       // 0–100 (low → extreme)
    renewableAdoption: number;     // 0–100 (%)
    populationGrowthRate: number;  // 0–100 (declining → rapid)
    aiRegulation: number;          // 0–100 (none → heavy)
    conflictProbability: number;   // 0–100 (low → high)
    economicExpansion: number;     // 0–100 (recession → boom)
    geoEngineeringLevel: number;   // 0–100 (none → heavy intervention)
    spaceColonization: number;     // 0–100 (none → multi-planetary)
}

export type Era =
    | 'anthropocene'      // 2025 – 2525   (next 500 yrs)
    | 'post-human'        // 2525 – 12025  (next ~10K yrs)
    | 'deep-civilization' // 12025 – 102025 (next ~100K yrs)
    | 'geological';       // 102025 – 1002025 (next ~1M yrs)

// ─── Year-Data Snapshot ───────────────────────────────────────────────────────
export interface YearData {
    year: number;
    temperature: number;        // °C above pre-industrial
    gdp: number;                // Trillion USD (constant 2025 dollars)
    population: number;         // Billions
    biodiversity: number;       // 0–100 survival index
    earthHealthScore: number;   // 0–100 composite
    seaLevel: number;           // metres rise from 2025
    conflictIndex: number;      // 0–100
    iceCoveragePercent: number; // 0–100 (% of surface covered in ice)
    atmosphericCO2ppm: number;  // ppm CO₂
    civilizationLevel: number;  // 0–100 (0 = extinct, 100 = peak)
    era: Era;
    eraLabel: string;
    majorEvent?: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
export const DEFAULT_PARAMS: SimulationParams = {
    co2EmissionRate: 50,
    renewableAdoption: 30,
    populationGrowthRate: 50,
    aiRegulation: 30,
    conflictProbability: 30,
    economicExpansion: 50,
    geoEngineeringLevel: 20,
    spaceColonization: 10,
};

// ─── Time-point Generation ────────────────────────────────────────────────────
// We generate ~700 sparse snapshots distributed logarithmically over 1M years.
function generateTimePoints(): number[] {
    const pts = new Set<number>();
    // Anthropocene: every year 2025–2125
    for (let y = 2025; y <= 2125; y++) pts.add(y);
    // Near future: every 10 years 2125–2525
    for (let y = 2125; y <= 2525; y += 10) pts.add(y);
    // Post-human: every 100 years 2525–12025
    for (let y = 2525; y <= 12025; y += 100) pts.add(y);
    // Deep Civilization: every 500 years 12025–102025
    for (let y = 12025; y <= 102025; y += 500) pts.add(y);
    // Geological: every 5000 years 102025–1002025
    for (let y = 102025; y <= 1002025; y += 5000) pts.add(y);
    return Array.from(pts).sort((a, b) => a - b);
}

// ─── Era Classification ───────────────────────────────────────────────────────
function getEra(year: number): { era: Era; eraLabel: string } {
    const offset = year - 2025;
    if (offset < 500) return { era: 'anthropocene', eraLabel: 'Anthropocene' };
    if (offset < 10000) return { era: 'post-human', eraLabel: 'Post-Human Era' };
    if (offset < 100000) return { era: 'deep-civilization', eraLabel: 'Deep Civilization' };
    return { era: 'geological', eraLabel: 'Geological Future' };
}

// ─── Milankovitch Ice-Age Cycling ─────────────────────────────────────────────
// Eccentricity ~100 K yr, obliquity ~41 K yr, precession ~23 K yr
// We approximate with a simple cosine blend.
function milankovitchOffset(offsetYears: number): number {
    const cycle100k = Math.cos((2 * Math.PI * offsetYears) / 100000);
    const cycle41k = Math.cos((2 * Math.PI * offsetYears) / 41000);
    const cycle23k = Math.cos((2 * Math.PI * offsetYears) / 23000);
    // Blend: positive = warming phase, negative = ice-age phase
    return (cycle100k * 0.5 + cycle41k * 0.3 + cycle23k * 0.2);
}

// ─── Super-Volcanic Events ────────────────────────────────────────────────────
const SUPERVOLCANO_EVENTS: { offset: number; name: string; cooling: number }[] = [
    { offset: 75000, name: 'Yellowstone Supervolcano Eruption', cooling: 4.5 },
    { offset: 290000, name: 'Long Valley Caldera Reactivation', cooling: 3.0 },
    { offset: 570000, name: 'Toba-Class Mega-Eruption', cooling: 6.0 },
    { offset: 820000, name: 'East African Rift Mega-Volcanic Event', cooling: 3.5 },
];

function getVolcanicCooling(offsetYears: number): { cooling: number; event?: string } {
    for (const v of SUPERVOLCANO_EVENTS) {
        const dist = Math.abs(offsetYears - v.offset);
        if (dist < 5000) {
            // Cooling decays over ~2000 years
            const decay = Math.exp(-dist / 2000);
            return { cooling: v.cooling * decay, event: dist < 500 ? v.name : undefined };
        }
    }
    return { cooling: 0 };
}

// ─── Mass Extinction Events ───────────────────────────────────────────────────
const EXTINCTION_EVENTS: { offset: number; name: string; biodiversityDrop: number }[] = [
    { offset: 250000, name: 'Anthropogenic Mass Extinction Peaks', biodiversityDrop: 30 },
    { offset: 570000, name: 'Mega-Volcanic Mass Extinction', biodiversityDrop: 25 },
    { offset: 800000, name: 'Oceanic Anoxic Event', biodiversityDrop: 20 },
];

// ─── Main Simulation Runner ───────────────────────────────────────────────────
export function runSimulation(params: SimulationParams): YearData[] {
    const timePoints = generateTimePoints();
    const data: YearData[] = [];

    const baseTemp = 1.2;   // current °C above pre-industrial
    const baseGDP = 105;   // $105T
    const basePop = 8.1;   // 8.1B
    const baseBio = 72;    // biodiversity index
    const baseCO2 = 421;   // ppm

    // Net emission factor (near-term)
    const netEmission = Math.max(0, (params.co2EmissionRate / 100) - (params.renewableAdoption / 100) * 0.75);

    for (const year of timePoints) {
        const offset = year - 2025;         // years from now
        const t = offset / 1000000;          // normalized 0–1 over 1M years
        const t100 = Math.min(1, offset / 100); // normalized 0–1 over 100 years
        const { era, eraLabel } = getEra(year);

        // ── Temperature ──────────────────────────────────────────────────────
        // Near-term: anthropogenic warming
        const anthropogenicWarm = netEmission > 0
            ? baseTemp + netEmission * 4.5 * Math.log(1 + t100 * 3) + (params.co2EmissionRate / 100) * 1.5 * t100
            : baseTemp + (params.co2EmissionRate / 100) * 0.5 * t100;

        // Geo-engineering cooling (effective after ~50 years)
        const geoEngineeringCooling = (params.geoEngineeringLevel / 100) * Math.min(1, offset / 50) * 1.8;

        // Long-term: carbon cycle drawdown over millennia
        const carbonDrawdown = Math.min(1.5, (offset / 10000) * 0.5 * (params.renewableAdoption / 100));

        // Milankovitch cycling (only matters for 10K+ year timescale)
        const milank = offset > 10000 ? milankovitchOffset(offset) * 2.5 : 0;

        // Volcanic cooling
        const { cooling: volcanicCooling, event: volcanicEvent } = getVolcanicCooling(offset);

        // Solar luminosity (negligible at 1M yrs: ~0.001% brighter/1000yrs)
        const solarBoost = (offset / 1000000) * 0.3;

        let temperature = anthropogenicWarm - geoEngineeringCooling - carbonDrawdown + milank - volcanicCooling + solarBoost;

        // If civilization collapses (no more emissions), temp slowly normalizes over millennia
        const civCollapseProb = (params.conflictProbability / 100) * 0.4 + (anthropogenicWarm > 4 ? 0.4 : 0);
        if (offset > 500 && civCollapseProb > 0.5) {
            const recoveryFactor = Math.min(1, (offset - 500) / 20000) * (civCollapseProb - 0.5) * 2;
            temperature -= recoveryFactor * 2; // earth cools after human collapse
        }
        temperature = Math.round(Math.max(-2, temperature) * 100) / 100;

        // ── CO₂ ppm ──────────────────────────────────────────────────────────
        const peakCO2 = baseCO2 + netEmission * 700 * Math.min(1, t100);
        const naturalDraw = Math.min(300, (offset / 100000) * 200 * (params.renewableAdoption / 100));
        const atmosphericCO2ppm = Math.round(Math.max(250, peakCO2 - naturalDraw));

        // ── Sea Level ────────────────────────────────────────────────────────
        // Each 1°C of warming → ~0.5m over decades; ice-age cycles add ±120m
        const thermSL = (temperature - baseTemp) * 0.5;
        const milankovitchSL = offset > 10000 ? -milankovitchOffset(offset) * 60 : 0; // ice ages drop sea level
        const seaLevel = Math.round((thermSL + milankovitchSL) * 100) / 100;

        // ── Ice Coverage ─────────────────────────────────────────────────────
        // Baseline ~12% today. Warms → less ice; cools → more ice
        const baseIce = 12;
        const tempEffect = -(temperature - baseTemp) * 4;
        const milankIce = offset > 10000 ? -milankovitchOffset(offset) * 20 : 0;
        const iceCoveragePercent = Math.round(Math.max(0, Math.min(100, baseIce + tempEffect + milankIce)));

        // ── Population ───────────────────────────────────────────────────────
        let population = basePop;
        if (offset <= 200) {
            const growthRate = (params.populationGrowthRate / 100) * 0.013;
            const stressFactor = Math.max(0.6, 1 - (temperature - 1.5) * 0.08);
            population = basePop * (1 + growthRate * offset * stressFactor);
        } else {
            // Approach carrying capacity or decline
            const peakPop = basePop * (1 + (params.populationGrowthRate / 100) * 0.013 * 200 * Math.max(0.6, 1 - (temperature - 1.5) * 0.08));
            const carryingCap = 15 * (params.renewableAdoption / 100) * (1 - temperature / 15) + 5;
            const k = Math.max(1, carryingCap);
            population = (k * peakPop) / (peakPop + (k - peakPop) * Math.exp(-0.005 * (offset - 200)));

            // Civilization collapse: population crash then recovery
            const collapseThreshold = 0.6;
            if (civCollapseProb > collapseThreshold && offset > 1000) {
                const crashFactor = 1 - (civCollapseProb - collapseThreshold) * 0.8;
                const recoveryTime = 50000;
                const recovery = Math.min(1, (offset - 1000) / recoveryTime);
                population *= (crashFactor + recovery * (1 - crashFactor));
            }

            // Space colonization adds "off-world" people (show total species pop)
            const offWorld = (params.spaceColonization / 100) * (offset / 1000000) * 20;
            population += offWorld;
        }
        population = Math.round(Math.max(0.01, population) * 100) / 100;

        // ── GDP ──────────────────────────────────────────────────────────────
        let gdp = baseGDP;
        if (offset < 1000) {
            const baseGrowthRate = (params.economicExpansion / 100) * 0.035;
            const aiBoost = (1 - params.aiRegulation / 100) * 0.025 * Math.min(1, offset / 100);
            const climatePenalty = Math.max(0, (temperature - 2) * 0.025);
            const conflictPenalty = (params.conflictProbability / 100) * 0.02 * Math.min(1, offset / 100);
            const multiplier = Math.max(0.2, 1 + (baseGrowthRate + aiBoost - climatePenalty - conflictPenalty) * Math.min(offset, 200));
            gdp = baseGDP * multiplier;
        } else {
            // Long-run: proportional to civilization level
            const normOffset = Math.min(1, offset / 1000000);
            const techMult = 1 + (params.spaceColonization / 100) * 100 * normOffset; // multi-planetary economy
            const civFactor = Math.max(0, 1 - civCollapseProb * 0.7);
            gdp = baseGDP * 5 * techMult * civFactor * population / basePop;
        }
        gdp = Math.round(Math.max(0, gdp) * 10) / 10;

        // ── Biodiversity ─────────────────────────────────────────────────────
        const tempStress = Math.max(0, (temperature - 1.5) * 6);
        const conflictStress = (params.conflictProbability / 100) * 12 * Math.min(1, offset / 200);
        const renewableBoost = (params.renewableAdoption / 100) * 8 * Math.min(1, offset / 200);
        const geoBoost = (params.geoEngineeringLevel / 100) * 5 * Math.min(1, offset / 5000);

        // Extinction events
        let extinctionDrop = 0;
        let extinctionEvent: string | undefined;
        for (const ev of EXTINCTION_EVENTS) {
            const dist = Math.abs(offset - ev.offset);
            if (dist < 20000) {
                extinctionDrop += ev.biodiversityDrop * Math.exp(-dist / 5000);
                if (dist < 1000) extinctionEvent = ev.name;
            }
        }

        // Long-run recovery: life always finds a way
        const evolutionBoost = offset > 100000 ? Math.min(20, (offset - 100000) / 20000) : 0;
        const biodiversity = Math.round(Math.max(5, Math.min(100,
            baseBio - tempStress - conflictStress + renewableBoost + geoBoost - extinctionDrop + evolutionBoost
        )));

        // ── Conflict Index ────────────────────────────────────────────────────
        const econStress = Math.max(0, (50 - params.economicExpansion) / 50);
        const climateRage = Math.max(0, (temperature - 2.5) * 8);
        const conflictIndex = Math.round(Math.min(100,
            params.conflictProbability * 0.55 + econStress * 25 + climateRage
        ));

        // ── Civilization Level ────────────────────────────────────────────────
        let civilizationLevel = 50;
        if (offset < 200) {
            civilizationLevel = 50 + (params.economicExpansion - 50) * 0.3 + (params.renewableAdoption - 30) * 0.2;
        } else {
            const techProgress = Math.min(40, (offset / 50000) * 30) * (params.spaceColonization / 100 + 0.3);
            const decline = conflictIndex * 0.3 + Math.max(0, temperature - 4) * 5;
            civilizationLevel = 50 + techProgress - decline;
        }
        civilizationLevel = Math.round(Math.max(0, Math.min(100, civilizationLevel)));

        // ── Earth Health Score ────────────────────────────────────────────────
        const tempScore = Math.max(0, 100 - (temperature - 1.2) * 18);
        const bioScore = biodiversity;
        const conflScore = 100 - conflictIndex;
        const earthHealthScore = Math.round(Math.max(0, Math.min(100,
            tempScore * 0.3 + bioScore * 0.3 + conflScore * 0.2 + civilizationLevel * 0.2
        )));

        // ── Major Event ───────────────────────────────────────────────────────
        const majorEvent = volcanicEvent || extinctionEvent;

        data.push({
            year,
            temperature,
            gdp,
            population,
            biodiversity,
            earthHealthScore,
            seaLevel,
            conflictIndex,
            iceCoveragePercent,
            atmosphericCO2ppm,
            civilizationLevel,
            era,
            eraLabel,
            ...(majorEvent ? { majorEvent } : {}),
        });
    }

    return data;
}

// ─── Slider Helpers (log-scale) ───────────────────────────────────────────────
const MAX_OFFSET = 1000000; // 1M years

export function sliderToYear(value: number): number {
    if (value <= 0) return 2025;
    if (value >= 1000) return 2025 + MAX_OFFSET;
    const offset = Math.round(Math.pow(MAX_OFFSET, value / 1000));
    return 2025 + Math.min(offset, MAX_OFFSET);
}

export function yearToSlider(year: number): number {
    const offset = year - 2025;
    if (offset <= 0) return 0;
    if (offset >= MAX_OFFSET) return 1000;
    return Math.round((Math.log(offset) / Math.log(MAX_OFFSET)) * 1000);
}

export function formatYear(year: number): string {
    const offset = year - 2025;
    if (offset === 0) return '2025';
    if (offset < 1000) return year.toLocaleString();
    if (offset < 1000000) return `${2025}+${(offset / 1000).toFixed(0)}K`;
    return '2025+1M';
}

export function formatYearFull(year: number): string {
    if (year < 1000000) return `Year ${year.toLocaleString()}`;
    return `Year ${(year / 1000000).toFixed(2)}M`;
}

// ─── Colour Utilities ─────────────────────────────────────────────────────────
export function getTemperatureColor(temp: number): string {
    const n = Math.min(1, Math.max(0, (temp - 1.2) / 6));
    if (n < 0.33) return `hsl(199, 89%, ${48 - n * 20}%)`;
    if (n < 0.66) return `hsl(${199 - (n - 0.33) * 3 * 161}, 89%, 48%)`;
    return `hsl(0, ${60 + n * 30}%, ${50 + n * 10}%)`;
}

export function getHealthColor(score: number): string {
    if (score >= 70) return 'hsl(142, 71%, 45%)';
    if (score >= 40) return 'hsl(38, 92%, 50%)';
    return 'hsl(0, 84%, 60%)';
}
