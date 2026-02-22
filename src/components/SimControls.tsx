import { Slider } from '@/components/ui/slider';
import type { SimulationParams } from '@/lib/simulation';

interface SimControlsProps {
    params: SimulationParams;
    onChange: (params: SimulationParams) => void;
}

const CONTROLS: {
    key: keyof SimulationParams;
    label: string;
    icon: string;
    low: string;
    high: string;
    colorClass: string;
    section: 'climate' | 'society' | 'deep';
}[] = [
        // Climate
        { key: 'co2EmissionRate', label: 'CO₂ Emissions', icon: '🏭', low: 'Net-Zero', high: 'Extreme', colorClass: 'text-destructive', section: 'climate' },
        { key: 'renewableAdoption', label: 'Renewable Energy', icon: '⚡', low: '0%', high: '100%', colorClass: 'text-accent', section: 'climate' },
        { key: 'geoEngineeringLevel', label: 'Geo-Engineering', icon: '🌡️', low: 'None', high: 'Heavy', colorClass: 'text-cyan-glow', section: 'climate' },
        // Society
        { key: 'populationGrowthRate', label: 'Population Growth', icon: '👥', low: 'Decline', high: 'Rapid', colorClass: 'text-primary', section: 'society' },
        { key: 'conflictProbability', label: 'Conflict Risk', icon: '⚔️', low: 'Peace', high: 'High', colorClass: 'text-warning', section: 'society' },
        { key: 'economicExpansion', label: 'Economic Growth', icon: '📈', low: 'Recession', high: 'Boom', colorClass: 'text-accent', section: 'society' },
        { key: 'aiRegulation', label: 'AI Regulation', icon: '🤖', low: 'None', high: 'Heavy', colorClass: 'text-secondary-foreground', section: 'society' },
        // Deep Time
        { key: 'spaceColonization', label: 'Space Colonization', icon: '🚀', low: 'None', high: 'Multi-Planet', colorClass: 'text-purple-400', section: 'deep' },
    ];

const SECTION_LABELS = {
    climate: '🌍 Climate',
    society: '🏛 Society',
    deep: '🚀 Deep Future',
};

export default function SimControls({ params, onChange }: SimControlsProps) {
    const handleChange = (key: keyof SimulationParams, value: number[]) => {
        onChange({ ...params, [key]: value[0] });
    };

    const sections = ['climate', 'society', 'deep'] as const;

    return (
        <div className="space-y-4">
            <h2 className="font-display text-xs font-semibold tracking-wide text-foreground">
                Parameters
            </h2>

            {sections.map((section) => (
                <div key={section} className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium px-1 mb-2">
                        {SECTION_LABELS[section]}
                    </p>
                    {CONTROLS.filter((c) => c.section === section).map(
                        ({ key, label, icon, low, high, colorClass }) => (
                            <div key={key} className="rounded-lg p-3 hover:bg-secondary/40 transition-colors">
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{icon}</span>
                                        <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
                                    </div>
                                    <span className="text-xs font-mono text-foreground/80 tabular-nums">
                                        {params[key]}
                                    </span>
                                </div>
                                <Slider
                                    value={[params[key]]}
                                    onValueChange={(v) => handleChange(key, v)}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="cursor-pointer"
                                />
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-[9px] text-muted-foreground font-medium">{low}</span>
                                    <span className="text-[9px] text-muted-foreground font-medium">{high}</span>
                                </div>
                            </div>
                        )
                    )}
                </div>
            ))}
        </div>
    );
}
