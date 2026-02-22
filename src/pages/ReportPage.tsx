import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, TrendingDown, TrendingUp, Snowflake, Flame, Zap } from 'lucide-react';
import type { YearData, SimulationParams } from '@/lib/simulation';
import { getHealthColor, formatYearFull } from '@/lib/simulation';
import { motion } from 'framer-motion';

// ── Report-level key year targets ────────────────────────────────────────────
const KEY_YEAR_OFFSETS = [100, 500, 2000, 10000, 100000, 500000, 1000000];

export default function ReportPage() {
    const navigate = useNavigate();
    const [data, setData] = useState<YearData[]>([]);
    const [params, setParams] = useState<SimulationParams | null>(null);

    useEffect(() => {
        const rawData = sessionStorage.getItem('simData');
        const rawParams = sessionStorage.getItem('simParams');
        if (rawData && rawParams) {
            setData(JSON.parse(rawData));
            setParams(JSON.parse(rawParams));
        }
    }, []);

    // Find closest data point to each key year offset
    const keyYears = useMemo(() =>
        KEY_YEAR_OFFSETS
            .map((offset) => {
                const target = 2025 + offset;
                return data.reduce((prev, cur) =>
                    Math.abs(cur.year - target) < Math.abs(prev.year - target) ? cur : prev,
                    data[0]
                );
            })
            .filter(Boolean) as YearData[],
        [data]
    );

    const finalData = data[data.length - 1];

    // Tipping points
    const tippingPoints = useMemo(() => {
        const pts: { year: number; event: string; severity: 'warning' | 'danger'; icon: 'temp' | 'bio' | 'sea' | 'ice' | 'volcano' }[] = [];
        for (const d of data) {
            if (d.temperature >= 2.0 && !pts.find((p) => p.event.includes('2°C')))
                pts.push({ year: d.year, event: 'Global temperatures exceed 2°C threshold', severity: 'warning', icon: 'temp' });
            if (d.temperature >= 3.0 && !pts.find((p) => p.event.includes('3°C')))
                pts.push({ year: d.year, event: 'Catastrophic 3°C warming reached', severity: 'danger', icon: 'temp' });
            if (d.biodiversity <= 50 && !pts.find((p) => p.event.includes('50%')))
                pts.push({ year: d.year, event: 'Biodiversity drops below 50% survival', severity: 'danger', icon: 'bio' });
            if (d.seaLevel >= 0.5 && !pts.find((p) => p.event.includes('0.5m')))
                pts.push({ year: d.year, event: 'Sea level rise exceeds 0.5 m', severity: 'warning', icon: 'sea' });
            if (d.iceCoveragePercent >= 30 && !pts.find((p) => p.event.includes('ice age')))
                pts.push({ year: d.year, event: 'Milankovitch ice age phase begins', severity: 'warning', icon: 'ice' });
            if (d.majorEvent && !pts.find((p) => p.event === d.majorEvent))
                pts.push({ year: d.year, event: d.majorEvent, severity: 'danger', icon: 'volcano' });
        }
        return pts.slice(0, 12); // cap at 12
    }, [data]);

    if (!finalData || !params) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">No simulation data found.</p>
                    <Button onClick={() => navigate('/simulation')}>Run a Simulation First</Button>
                </div>
            </div>
        );
    }

    // Generate headlines
    const headlines = keyYears.map((d) => {
        if (d.temperature < 2 && d.biodiversity > 60)
            return { year: d.year, headline: `🌿 Temperature held below 2°C — renewable leadership at ${d.biodiversity}% biodiversity`, tone: 'positive' };
        if (d.iceCoveragePercent >= 25)
            return { year: d.year, headline: `❄️ Milankovitch ice age grips Earth — ice covers ${d.iceCoveragePercent}% of surface, sea levels drop ${Math.abs(d.seaLevel)}m`, tone: 'neutral' };
        if (d.biodiversity < 40)
            return { year: d.year, headline: `☠️ Mass extinction accelerates — biodiversity index plummets to ${d.biodiversity}%`, tone: 'negative' };
        if (d.civilizationLevel < 20)
            return { year: d.year, headline: `🏚 Civilizational collapse detected — civilization index: ${d.civilizationLevel}/100`, tone: 'negative' };
        if (d.civilizationLevel > 80 && d.year > 100000)
            return { year: d.year, headline: `🚀 Advanced civilization thrives — multi-planetary society at ${d.civilizationLevel}/100`, tone: 'positive' };
        return { year: d.year, headline: `🌍 World at +${d.temperature}°C — ${d.population}B people, $${d.gdp}T GDP, ${d.atmosphericCO2ppm}ppm CO₂`, tone: 'neutral' };
    });

    const ICON_MAP = { temp: Flame, bio: TrendingDown, sea: TrendingDown, ice: Snowflake, volcano: Flame };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border/50 px-6 py-4 flex items-center gap-4 bg-card/40 backdrop-blur-md">
                <Button variant="ghost" size="icon" onClick={() => navigate('/simulation')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="font-display text-sm font-semibold text-foreground tracking-wide">
                        Scenario Report · 1,000,000 Year Analysis
                    </h1>
                    <p className="text-[10px] text-muted-foreground font-medium">
                        From 2025 to {formatYearFull(finalData.year)}
                    </p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-6 space-y-8">
                {/* Summary */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="font-display text-xl font-bold text-foreground mb-4">Million-Year Summary</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <SummaryCard label="Peak Temp" value={`+${finalData.temperature}°C`} color="hsl(0, 84%, 60%)" />
                        <SummaryCard label="Final GDP" value={`$${finalData.gdp}T`} color="hsl(38, 92%, 50%)" />
                        <SummaryCard label="Population" value={`${finalData.population}B`} color="hsl(142, 71%, 45%)" />
                        <SummaryCard label="Health Score" value={`${finalData.earthHealthScore}/100`} color={getHealthColor(finalData.earthHealthScore)} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <SummaryCard label="Ice Coverage" value={`${finalData.iceCoveragePercent}%`} color="#81d4fa" />
                        <SummaryCard label="CO₂" value={`${finalData.atmosphericCO2ppm} ppm`} color="hsl(38, 80%, 55%)" />
                        <SummaryCard label="Biodiversity" value={`${finalData.biodiversity}%`} color="hsl(142, 65%, 45%)" />
                        <SummaryCard label="Civilization" value={`${finalData.civilizationLevel}/100`} color="hsl(260, 70%, 60%)" />
                    </div>
                </motion.section>

                {/* Deep-Time Headlines */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <h2 className="font-display text-xl font-bold text-foreground mb-4">Future Headlines</h2>
                    <div className="space-y-3">
                        {headlines.map(({ year, headline, tone }) => (
                            <div key={year} className="rounded-lg border border-border bg-card p-4 flex gap-4 items-start">
                                <span className="font-display text-sm font-bold text-primary shrink-0 min-w-[90px]">
                                    {formatYearFull(year)}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm text-foreground">{headline}</p>
                                    <span className={`text-[10px] uppercase tracking-wider ${tone === 'positive' ? 'text-green-400' : tone === 'negative' ? 'text-red-400' : 'text-amber-400'
                                        }`}>
                                        {tone === 'positive' && <TrendingUp className="h-3 w-3 inline mr-1" />}
                                        {tone === 'negative' && <TrendingDown className="h-3 w-3 inline mr-1" />}
                                        {tone}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Tipping Points */}
                {tippingPoints.length > 0 && (
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h2 className="font-display text-xl font-bold text-foreground mb-4">Tipping Points & Milestones</h2>
                        <div className="space-y-2">
                            {tippingPoints.map((tp, i) => {
                                const Icon = ICON_MAP[tp.icon] ?? AlertTriangle;
                                return (
                                    <div key={i} className={`rounded-lg border p-4 flex items-center gap-3 ${tp.severity === 'danger'
                                            ? 'border-red-500/30 bg-red-950/20'
                                            : 'border-amber-500/30 bg-amber-950/20'
                                        }`}>
                                        <Icon className={`h-4 w-4 shrink-0 ${tp.severity === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
                                        <div>
                                            <span className="font-display text-sm font-bold text-primary mr-2">{formatYearFull(tp.year)}</span>
                                            <span className="text-sm text-foreground">{tp.event}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.section>
                )}

                {/* Narrative */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <h2 className="font-display text-xl font-bold text-foreground mb-4">Scenario Narrative</h2>
                    <div className="rounded-lg border border-border bg-card p-6">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {generateNarrative(params, finalData, tippingPoints.length)}
                        </p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="font-display text-xl font-bold mt-1" style={{ color }}>{value}</p>
        </div>
    );
}

function generateNarrative(params: SimulationParams, final: YearData, tippingCount: number): string {
    const parts: string[] = [];

    parts.push(
        final.temperature > 3
            ? `Over the course of one million years, this scenario paints a turbulent picture. Early anthropogenic emissions drove temperatures to +${final.temperature}°C, triggering cascading ecological collapse.`
            : final.temperature > 2
                ? `One million years of simulation reveal a world that narrowly avoids worst-case scenarios. Temperatures peaked at +${final.temperature}°C before carbon cycle feedbacks and policy action began a slow recovery.`
                : `Across one million years, decisive early action limited warming to just +${final.temperature}°C — an extraordinary testament to coordinated planetary stewardship.`
    );

    if (params.renewableAdoption > 70)
        parts.push(`The aggressive transition to renewable energy (${params.renewableAdoption}% adoption) formed the backbone of climate mitigation, enabling rapid CO₂ drawdown and eventual atmospheric restoration.`);

    // Ice ages
    parts.push(`On geological timescales, Milankovitch cycles reshaped the planet repeatedly. Ice ages locked water in ice sheets, dropping sea levels by up to 120 m, only for interglacial warmings to reverse the process — a cosmic rhythm playing out across the simulation.`);

    if (params.spaceColonization > 50)
        parts.push(`Multi-planetary expansion became humanity's defining achievement. Off-world colonies reduced pressure on Earth's biosphere and provided long-term civilizational resilience.`);

    if (final.biodiversity < 40)
        parts.push(`Devastatingly, biodiversity collapsed to ${final.biodiversity}% — one of the great mass extinctions in Earth's history, rivalling the Permian event.`);
    else if (final.biodiversity > 70)
        parts.push(`Remarkably, life proved resilient. By the million-year mark, biodiversity had stabilised at ${final.biodiversity}%, with evolutionary pressures driving the emergence of entirely new species lineages.`);

    if (tippingCount > 3)
        parts.push(`The crossing of ${tippingCount} critical tipping points — from supervolcanic winters to oceanic anoxic events — created cascading effects whose echoes will reverberate for tens of millions of years.`);

    if (final.civilizationLevel > 70)
        parts.push(`Against all odds, a civilization-level score of ${final.civilizationLevel}/100 suggests that intelligence and technology endured — perhaps unrecognisable by today's standards, but nonetheless thriving.`);
    else if (final.civilizationLevel < 20)
        parts.push(`Civilisation as we know it did not survive the deep future. With a civilization index of only ${final.civilizationLevel}/100, Earth returned to a pre-industrial state — nature reclaiming cities over tens of thousands of years.`);

    return parts.join(' ');
}
