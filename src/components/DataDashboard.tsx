import { useMemo } from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import type { YearData } from '@/lib/simulation';
import { getHealthColor, formatYear } from '@/lib/simulation';

interface DataDashboardProps {
    data: YearData[];
    currentYear: number;
}

const TOOLTIP_STYLE = {
    background: 'hsl(228, 12%, 11%)',
    border: '1px solid hsl(228, 10%, 18%)',
    fontSize: 11,
    borderRadius: 8,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#e2e8f0',
};

export default function DataDashboard({ data, currentYear }: DataDashboardProps) {
    const currentData = useMemo(
        () =>
            data.reduce(
                (prev, cur) =>
                    Math.abs(cur.year - currentYear) < Math.abs(prev.year - currentYear) ? cur : prev,
                data[0]
            ),
        [data, currentYear]
    );

    // Thin out chart data to ≤ 300 points for performance
    const chartData = useMemo(() => {
        const visible = data.filter((d) => d.year <= currentYear);
        if (visible.length <= 300) return visible;
        const step = Math.ceil(visible.length / 300);
        return visible.filter((_, i) => i % step === 0);
    }, [data, currentYear]);

    const healthColor = getHealthColor(currentData.earthHealthScore);

    if (!currentData) return null;

    return (
        <div className="space-y-3">
            <h2 className="font-display text-xs font-semibold tracking-wide text-foreground">
                Live Metrics
            </h2>

            {/* Earth Health Score */}
            <div className="rounded-xl border border-border/40 bg-card/60 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                    Earth Health
                </p>
                <div className="relative inline-block">
                    <p className="font-display text-5xl font-bold tabular-nums" style={{ color: healthColor }}>
                        {currentData.earthHealthScore}
                    </p>
                    <span className="text-xs text-muted-foreground absolute -right-6 top-2 font-medium">/100</span>
                </div>
            </div>

            {/* Core metrics grid */}
            <div className="grid grid-cols-2 gap-1.5">
                <MetricCard label="Temperature" value={`${currentData.temperature >= 0 ? '+' : ''}${currentData.temperature}°C`} color="hsl(var(--destructive))" />
                <MetricCard label="Sea Level" value={`${currentData.seaLevel >= 0 ? '+' : ''}${currentData.seaLevel}m`} color="hsl(var(--primary))" />
                <MetricCard label="Population" value={`${currentData.population}B`} color="hsl(var(--accent))" />
                <MetricCard label="World GDP" value={`$${currentData.gdp}T`} color="hsl(var(--warning))" />
                <MetricCard label="Ice Coverage" value={`${currentData.iceCoveragePercent}%`} color="#81d4fa" />
                <MetricCard label="CO₂ Level" value={`${currentData.atmosphericCO2ppm} ppm`} color="hsl(38,80%,55%)" />
            </div>

            {/* Civilization level */}
            <div className="rounded-lg border border-border/30 bg-card/40 p-3">
                <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                        Civilization Level
                    </p>
                    <p className="text-xs font-mono font-semibold text-foreground">{currentData.civilizationLevel}/100</p>
                </div>
                <div className="w-full bg-secondary/40 rounded-full h-1.5">
                    <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                            width: `${currentData.civilizationLevel}%`,
                            background: `hsl(${260 + currentData.civilizationLevel}, 70%, 60%)`,
                        }}
                    />
                </div>
            </div>

            {/* Biodiversity */}
            <div className="rounded-lg border border-border/30 bg-card/40 p-3">
                <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                        Biodiversity Index
                    </p>
                    <p className="text-xs font-mono font-semibold text-foreground">{currentData.biodiversity}/100</p>
                </div>
                <div className="w-full bg-secondary/40 rounded-full h-1.5">
                    <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                            width: `${currentData.biodiversity}%`,
                            background: `hsl(${currentData.biodiversity * 1.2}, 65%, 45%)`,
                        }}
                    />
                </div>
            </div>

            {/* Charts */}
            <MiniChart title="Temperature (°C)" data={chartData} dataKey="temperature" color="hsl(var(--destructive))" type="line" />
            <MiniChart title="Ice Coverage (%)" data={chartData} dataKey="iceCoveragePercent" color="#81d4fa" type="area" domain={[0, 100]} />
            <MiniChart title="Biodiversity" data={chartData} dataKey="biodiversity" color="hsl(var(--accent))" type="area" domain={[0, 100]} />
            <MiniChart title="GDP ($T)" data={chartData} dataKey="gdp" color="hsl(var(--warning))" type="area" />
        </div>
    );
}

// ── Small Components ──────────────────────────────────────────────────────────
function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="rounded-lg border border-border/30 bg-card/40 p-2.5 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
            <p className="font-display text-sm font-semibold mt-0.5 tabular-nums" style={{ color }}>
                {value}
            </p>
        </div>
    );
}

function MiniChart({
    title, data, dataKey, color, type, domain,
}: {
    title: string;
    data: YearData[];
    dataKey: keyof YearData;
    color: string;
    type: 'line' | 'area';
    domain?: [number, number];
}) {
    // Custom x-axis formatter
    const xFormatter = (year: number) => formatYear(year);

    return (
        <div className="rounded-lg border border-border/30 bg-card/40 p-2.5">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">{title}</p>
            <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                    {type === 'line' ? (
                        <LineChart data={data}>
                            <XAxis dataKey="year" tick={false} axisLine={false} tickFormatter={xFormatter} />
                            <YAxis tick={false} axisLine={false} domain={domain || ['auto', 'auto']} width={0} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                labelFormatter={(v) => formatYear(v as number)}
                            />
                            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </LineChart>
                    ) : (
                        <AreaChart data={data}>
                            <XAxis dataKey="year" tick={false} axisLine={false} tickFormatter={xFormatter} />
                            <YAxis tick={false} axisLine={false} domain={domain || ['auto', 'auto']} width={0} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                labelFormatter={(v) => formatYear(v as number)}
                            />
                            <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.09} strokeWidth={1.5} isAnimationActive={false} />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
