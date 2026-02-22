import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, FileText, ChevronLeft, Zap, Snowflake, Flame } from 'lucide-react';
import EarthGlobe from '@/components/EarthGlobe';
import SimControls from '@/components/SimControls';
import DataDashboard from '@/components/DataDashboard';
import {
    runSimulation,
    DEFAULT_PARAMS,
    type SimulationParams,
    sliderToYear,
    yearToSlider,
    formatYearFull,
    formatYear,
} from '@/lib/simulation';

const ERA_BADGE: Record<string, { label: string; color: string; bg: string }> = {
    anthropocene: { label: 'Anthropocene', color: 'text-blue-400', bg: 'bg-blue-900/30' },
    'post-human': { label: 'Post-Human Era', color: 'text-green-400', bg: 'bg-green-900/30' },
    'deep-civilization': { label: 'Deep Civilization', color: 'text-purple-400', bg: 'bg-purple-900/30' },
    geological: { label: 'Geological Future', color: 'text-amber-400', bg: 'bg-amber-900/30' },
};

export default function SimulationPage() {
    const navigate = useNavigate();
    const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
    const [sliderVal, setSliderVal] = useState(0);          // 0–1000 log-scale
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(1);          // 1, 5, 20
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const data = useMemo(() => runSimulation(params), [params]);

    // Find the closest data point to the current slider year
    const currentYear = useMemo(() => sliderToYear(sliderVal), [sliderVal]);
    const currentData = useMemo(() => {
        if (!data.length) return data[0];
        return data.reduce((prev, cur) =>
            Math.abs(cur.year - currentYear) < Math.abs(prev.year - currentYear) ? cur : prev
        );
    }, [data, currentYear]);

    // Playback — advance slider, not year directly
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setSliderVal((prev) => {
                    const next = prev + playSpeed;
                    if (next >= 1000) {
                        setIsPlaying(false);
                        return 1000;
                    }
                    return next;
                });
            }, 100);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPlaying, playSpeed]);

    const handleReset = useCallback(() => {
        setParams(DEFAULT_PARAMS);
        setSliderVal(0);
        setIsPlaying(false);
    }, []);

    const handleGenerateReport = () => {
        sessionStorage.setItem('simParams', JSON.stringify(params));
        sessionStorage.setItem('simData', JSON.stringify(data));
        navigate('/report');
    };

    const getTempStyle = () => {
        if (!currentData) return 'text-primary';
        if (currentData.temperature < 2) return 'text-primary';
        if (currentData.temperature < 3.5) return 'text-warning';
        return 'text-destructive';
    };

    const eraBadge = ERA_BADGE[currentData?.era ?? 'anthropocene'] ?? ERA_BADGE.anthropocene;

    // Cycle play speeds
    const cycleSpeed = () => {
        setPlaySpeed((s) => s === 1 ? 5 : s === 5 ? 20 : 1);
    };

    const speedLabel = playSpeed === 1 ? '1×' : playSpeed === 5 ? '5×' : '20×';

    return (
        <div className="min-h-screen bg-background overflow-hidden">
            {/* ── Header ── */}
            <header className="h-12 border-b border-border/50 px-5 flex items-center justify-between bg-card/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="font-display text-sm font-semibold text-foreground">Earth Twin</span>
                    </button>
                    <div className="h-3.5 w-px bg-border/50" />
                    <span className="text-[11px] text-muted-foreground font-medium">1,000,000 Year Simulation</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                        <RotateCcw className="h-3 w-3 mr-1.5" /> Reset
                    </Button>
                    <Button size="sm" onClick={handleGenerateReport} className="h-8 text-xs glow-cyan">
                        <FileText className="h-3 w-3 mr-1.5" /> Generate Report
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-[270px_1fr_290px] h-[calc(100vh-48px)]">
                {/* ── Left Panel ── */}
                <aside className="border-r border-border/30 bg-card/20 overflow-y-auto">
                    <div className="p-4">
                        <SimControls params={params} onChange={setParams} />
                    </div>
                </aside>

                {/* ── Center ── */}
                <main className="flex flex-col items-center justify-between p-5 relative overflow-hidden">
                    {/* Top info row */}
                    <div className="w-full flex items-start justify-between z-10">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-0.5">Year</p>
                            <p className="font-display text-3xl font-bold text-foreground tabular-nums">
                                {formatYear(currentData?.year ?? 2025)}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                {formatYearFull(currentData?.year ?? 2025)}
                            </p>
                        </div>

                        {/* Era badge */}
                        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${eraBadge.bg}`}>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${eraBadge.color}`}>
                                {eraBadge.label}
                            </span>
                        </div>

                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-0.5">Warming</p>
                            <p className={`font-display text-3xl font-bold tabular-nums ${getTempStyle()}`}>
                                {currentData?.temperature >= 0 ? '+' : ''}{currentData?.temperature}°C
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                🧊 {currentData?.iceCoveragePercent ?? 12}% ice
                            </p>
                        </div>
                    </div>

                    {/* Earth Globe */}
                    <div className="flex-1 w-full flex items-center justify-center -my-2">
                        <EarthGlobe
                            temperature={currentData?.temperature ?? 1.2}
                            iceCoveragePercent={currentData?.iceCoveragePercent ?? 12}
                            era={currentData?.era ?? 'anthropocene'}
                            interactive
                            size="lg"
                        />
                    </div>

                    {/* ── Major Event Banner ── */}
                    {currentData?.majorEvent && (
                        <div className="w-full max-w-md mb-2 rounded-lg border border-amber-500/30 bg-amber-900/20 px-4 py-2 flex items-center gap-2">
                            <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            <p className="text-[11px] text-amber-300 font-medium">{currentData.majorEvent}</p>
                        </div>
                    )}

                    {/* ── Timeline ── */}
                    <div className="w-full max-w-lg space-y-3 pb-1">
                        {/* Log-scale slider */}
                        <Slider
                            value={[sliderVal]}
                            onValueChange={(v) => { setSliderVal(v[0]); setIsPlaying(false); }}
                            min={0}
                            max={1000}
                            step={1}
                        />

                        {/* Era milestones */}
                        <div className="flex justify-between px-0.5">
                            {[
                                { label: '2025', val: 0 },
                                { label: '+500', val: yearToSlider(2525) },
                                { label: '+10K', val: yearToSlider(12025) },
                                { label: '+100K', val: yearToSlider(102025) },
                                { label: '+1M', val: 1000 },
                            ].map(({ label, val }) => (
                                <button
                                    key={label}
                                    onClick={() => { setSliderVal(val); setIsPlaying(false); }}
                                    className="text-[9px] text-muted-foreground hover:text-foreground font-medium tabular-nums transition-colors"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Playback controls */}
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => { setSliderVal(0); setIsPlaying(false); }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-full"
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                            </Button>
                            <button
                                onClick={cycleSpeed}
                                className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors border border-border/40 rounded px-1.5 py-0.5"
                            >
                                <Zap className="h-3 w-3" />
                                {speedLabel}
                            </button>
                        </div>
                    </div>
                </main>

                {/* ── Right Panel ── */}
                <aside className="border-l border-border/30 bg-card/20 overflow-y-auto">
                    <div className="p-4">
                        <DataDashboard data={data} currentYear={currentData?.year ?? 2025} />
                    </div>
                </aside>
            </div>
        </div>
    );
}
