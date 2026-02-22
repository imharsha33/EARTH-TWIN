import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, FileText, ChevronLeft, Zap, Flame, SlidersHorizontal, BarChart2 } from 'lucide-react';
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

type MobileTab = 'controls' | 'globe' | 'data';

export default function SimulationPage() {
    const navigate = useNavigate();
    const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
    const [sliderVal, setSliderVal] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(1);
    const [mobileTab, setMobileTab] = useState<MobileTab>('globe');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const data = useMemo(() => runSimulation(params), [params]);

    const currentYear = useMemo(() => sliderToYear(sliderVal), [sliderVal]);
    const currentData = useMemo(() => {
        if (!data.length) return data[0];
        return data.reduce((prev, cur) =>
            Math.abs(cur.year - currentYear) < Math.abs(prev.year - currentYear) ? cur : prev
        );
    }, [data, currentYear]);

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setSliderVal((prev) => {
                    const next = prev + playSpeed;
                    if (next >= 1000) { setIsPlaying(false); return 1000; }
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
    const cycleSpeed = () => setPlaySpeed((s) => s === 1 ? 5 : s === 5 ? 20 : 1);
    const speedLabel = playSpeed === 1 ? '1×' : playSpeed === 5 ? '5×' : '20×';

    /* ── Shared Centre Panel content ─────────────────────────────────────── */
    const CentrePanel = () => (
        <main className="flex flex-col items-center justify-between p-4 sm:p-5 relative overflow-hidden h-full">
            {/* Top info row */}
            <div className="w-full flex items-start justify-between z-10 gap-2">
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-0.5">Year</p>
                    <p className="font-display text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                        {formatYear(currentData?.year ?? 2025)}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        {formatYearFull(currentData?.year ?? 2025)}
                    </p>
                </div>

                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${eraBadge.bg} self-start mt-1`}>
                    <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${eraBadge.color}`}>
                        {eraBadge.label}
                    </span>
                </div>

                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-0.5">Warming</p>
                    <p className={`font-display text-2xl sm:text-3xl font-bold tabular-nums ${getTempStyle()}`}>
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

            {/* Major Event Banner */}
            {currentData?.majorEvent && (
                <div className="w-full max-w-md mb-2 rounded-lg border border-amber-500/30 bg-amber-900/20 px-3 py-2 flex items-center gap-2">
                    <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-300 font-medium">{currentData.majorEvent}</p>
                </div>
            )}

            {/* Timeline */}
            <div className="w-full max-w-lg space-y-3 pb-1">
                <Slider
                    value={[sliderVal]}
                    onValueChange={(v) => { setSliderVal(v[0]); setIsPlaying(false); }}
                    min={0} max={1000} step={1}
                />
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
                        <Zap className="h-3 w-3" />{speedLabel}
                    </button>
                </div>
            </div>
        </main>
    );

    return (
        <div className="min-h-screen bg-background overflow-hidden flex flex-col">
            {/* ── Header ── */}
            <header className="h-12 border-b border-border/50 px-3 sm:px-5 flex items-center justify-between bg-card/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="font-display text-sm font-semibold text-foreground">Earth Twin</span>
                    </button>
                    <div className="hidden sm:block h-3.5 w-px bg-border/50" />
                    <span className="hidden sm:block text-[11px] text-muted-foreground font-medium">1,000,000 Year Simulation</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs text-muted-foreground hover:text-foreground px-2 sm:px-3">
                        <RotateCcw className="h-3 w-3 sm:mr-1.5" />
                        <span className="hidden sm:inline">Reset</span>
                    </Button>
                    <Button size="sm" onClick={handleGenerateReport} className="h-8 text-xs glow-cyan px-2 sm:px-3">
                        <FileText className="h-3 w-3 sm:mr-1.5" />
                        <span className="hidden sm:inline">Generate Report</span>
                    </Button>
                </div>
            </header>

            {/* ── DESKTOP Layout: 3-column grid ── */}
            <div className="hidden lg:grid lg:grid-cols-[270px_1fr_290px] flex-1 h-[calc(100vh-48px)]">
                <aside className="border-r border-border/30 bg-card/20 overflow-y-auto">
                    <div className="p-4"><SimControls params={params} onChange={setParams} /></div>
                </aside>
                <CentrePanel />
                <aside className="border-l border-border/30 bg-card/20 overflow-y-auto">
                    <div className="p-4"><DataDashboard data={data} currentYear={currentData?.year ?? 2025} /></div>
                </aside>
            </div>

            {/* ── MOBILE Layout: tabbed ── */}
            <div className="flex lg:hidden flex-col flex-1 overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-border/50 shrink-0 bg-card/40">
                    {([
                        { id: 'controls', label: 'Controls', Icon: SlidersHorizontal },
                        { id: 'globe', label: 'Globe', Icon: Zap },
                        { id: 'data', label: 'Data', Icon: BarChart2 },
                    ] as { id: MobileTab; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => setMobileTab(id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${mobileTab === id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {mobileTab === 'controls' && (
                        <div className="p-4">
                            <SimControls params={params} onChange={setParams} />
                        </div>
                    )}
                    {mobileTab === 'globe' && (
                        <div className="h-full flex flex-col" style={{ minHeight: 'calc(100vh - 96px)' }}>
                            <CentrePanel />
                        </div>
                    )}
                    {mobileTab === 'data' && (
                        <div className="p-4">
                            <DataDashboard data={data} currentYear={currentData?.year ?? 2025} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
