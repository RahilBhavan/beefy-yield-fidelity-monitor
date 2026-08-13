'use client';

import { useId, useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { DriftPoint } from '@/lib/dashboard';

interface DriftChartProps {
    vaultName: string | null;
    points: DriftPoint[];
}

type Range = 7 | 14 | 30 | 90;

const width = 820;
const height = 320;
const padding = { top: 20, right: 20, bottom: 46, left: 66 };

export function DriftChart({ vaultName, points }: DriftChartProps) {
    const [range, setRange] = useState<Range>(30);
    const hatchId = useId().replace(/[:]/g, '');

    const filtered = useMemo(() => {
        if (points.length === 0) return [];
        const latest = Math.max(...points.map((point) => Date.parse(point.recordedAt)));
        const cutoff = latest - range * 86_400_000;
        return points.filter((point) => Date.parse(point.recordedAt) >= cutoff);
    }, [points, range]);

    if (points.length === 0 || filtered.length === 0) {
        return (
            <section aria-labelledby="performance-chart-title" className="border border-[#1E1E1E] bg-[#EBEBEB] p-5 md:p-7">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E1E1E]/70">Performance variance</p>
                <h2 id="performance-chart-title" className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight md:text-2xl">
                    <TrendingUp className="h-5 w-5 text-[#FE5238]" aria-hidden="true" />
                    Expected vs realized return
                </h2>
                <div role="status" className="mt-6 flex min-h-[240px] flex-col items-center justify-center gap-2 border border-dashed border-[#1E1E1E]/30 px-6 py-10 text-center">
                    <p className="font-mono text-xs font-bold uppercase tracking-wide text-[#1E1E1E]/70">No signal in range</p>
                    <p className="max-w-sm text-sm text-[#1E1E1E]/70">Not enough interval-matched observations exist yet to plot expected versus realized return for this window.</p>
                </div>
            </section>
        );
    }

    const values = filtered.flatMap((point) => [point.target, point.actual, 0]);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const margin = Math.max(0.05, (rawMax - rawMin) * 0.15);
    const minValue = rawMin - margin;
    const maxValue = rawMax + margin;
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const x = (index: number) => padding.left + (filtered.length <= 1 ? plotWidth / 2 : index / (filtered.length - 1) * plotWidth);
    const y = (value: number) => padding.top + (maxValue - value) / (maxValue - minValue) * plotHeight;
    const line = (key: 'target' | 'actual') => filtered
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(point[key]).toFixed(2)}`)
        .join(' ');
    const gapArea = filtered.length > 1
        ? `${filtered.map((point, index) => `${x(index)},${y(point.target)}`).join(' ')} ${[...filtered].reverse().map((point, reverseIndex) => {
            const index = filtered.length - 1 - reverseIndex;
            return `${x(index)},${y(point.actual)}`;
        }).join(' ')}`
        : '';
    const latestPoint = filtered[filtered.length - 1];
    const relativeDrift = latestPoint.target > 0
        ? (latestPoint.actual - latestPoint.target) / latestPoint.target * 100
        : 0;
    const tickValues = Array.from({ length: 5 }, (_, index) => maxValue - index * (maxValue - minValue) / 4);
    const xLabels = [...new Set([0, Math.floor((filtered.length - 1) / 2), filtered.length - 1])];

    return (
        <section aria-labelledby="performance-chart-title" className="border border-[#1E1E1E] bg-[#EBEBEB] p-5 md:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E1E1E]/70">Performance variance</p>
                    <h2 id="performance-chart-title" className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight md:text-2xl">
                        <TrendingUp className="h-5 w-5 text-[#FE5238]" aria-hidden="true" />
                        Expected vs realized return
                    </h2>
                    <p className="mt-1 text-sm text-[#1E1E1E]/70">{vaultName} · cumulative return from interval-matched observations</p>
                </div>
                <div className="flex border-[1.5px] border-[#1E1E1E]" aria-label="Chart date range">
                    {([7, 14, 30, 90] as Range[]).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setRange(option)}
                            className={`min-h-11 min-w-11 px-2.5 font-mono text-[11px] font-bold transition-colors ${range === option ? 'bg-[#1E1E1E] text-[#FE5238]' : 'text-[#1E1E1E] hover:bg-[#1E1E1E]/10'}`}
                            aria-pressed={range === option}
                        >
                            {option}D
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 divide-x divide-[#1E1E1E]/15 border-y border-[#1E1E1E]/15 py-4">
                <ChartMetric label="Expected" value={`${latestPoint.target.toFixed(3)}%`} className="text-[#1E1E1E]" />
                <ChartMetric label="Realized" value={`${latestPoint.actual.toFixed(3)}%`} className="text-[#A82A18]" />
                <ChartMetric label="Relative drift" value={`${relativeDrift.toFixed(1)}%`} className={relativeDrift <= -5 ? 'text-[#A82A18]' : 'text-[#1E1E1E]'} />
            </div>

            <div className="mt-5 overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[640px] w-full" role="img" aria-labelledby="chart-svg-title chart-svg-description">
                    <title id="chart-svg-title">Cumulative expected and realized return for {vaultName}</title>
                    <desc id="chart-svg-description">A line chart comparing expected return based on interval-matched APY with realized on-chain price-per-share growth, {filtered.length} observations from {filtered[0]?.label} to {latestPoint.label}.</desc>
                    <defs>
                        <pattern id={`hatch-${hatchId}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="6" stroke="#1E1E1E" strokeWidth="1" opacity="0.18" />
                        </pattern>
                    </defs>

                    {/* Y axis title */}
                    <text x={-height / 2} y={16} textAnchor="middle" fontSize="10" fill="#1E1E1E" opacity="0.75" fontFamily="ui-monospace, monospace" fontWeight="700" letterSpacing="0.08em" transform="rotate(-90)">CUMULATIVE RETURN</text>

                    {tickValues.map((tick) => (
                        <g key={tick}>
                            <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="#1E1E1E" strokeOpacity="0.12" strokeWidth="1" />
                            <text x={padding.left - 10} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="#1E1E1E" fillOpacity="0.75" fontFamily="ui-monospace, monospace">{tick.toFixed(2)}%</text>
                        </g>
                    ))}
                    {xLabels.map((index) => (
                        <line key={`grid-${index}`} x1={x(index)} x2={x(index)} y1={padding.top} y2={height - padding.bottom} stroke="#1E1E1E" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="2 3" />
                    ))}

                    <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} stroke="#1E1E1E" strokeWidth="1.5" />
                    <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} stroke="#1E1E1E" strokeWidth="1.5" />

                    {gapArea && <polygon points={gapArea} fill={`url(#hatch-${hatchId})`} stroke="#1E1E1E" strokeOpacity="0.15" strokeWidth="1" />}
                    <path d={line('target')} fill="none" stroke="#1E1E1E" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    <path d={line('actual')} fill="none" stroke="#FE5238" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    {filtered.map((point, index) => (
                        <g key={point.recordedAt}>
                            <circle cx={x(index)} cy={y(point.target)} r="3.5" fill="#EBEBEB" stroke="#1E1E1E" strokeWidth="2">
                                <title>{point.label}: expected {point.target.toFixed(3)}%</title>
                            </circle>
                            <circle cx={x(index)} cy={y(point.actual)} r="3.5" fill="#EBEBEB" stroke="#FE5238" strokeWidth="2">
                                <title>{point.label}: realized {point.actual.toFixed(3)}%</title>
                            </circle>
                        </g>
                    ))}
                    {xLabels.map((index) => (
                        <text key={index} x={x(index)} y={height - 16} textAnchor="middle" fontSize="11" fill="#1E1E1E" fillOpacity="0.75" fontFamily="ui-monospace, monospace">
                            {filtered[index]?.label}
                        </text>
                    ))}
                </svg>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-wide text-[#1E1E1E]/70">
                <span className="inline-flex items-center gap-2"><span className="h-0.5 w-6 bg-[#1E1E1E]" /> Expected return</span>
                <span className="inline-flex items-center gap-2"><span className="h-0.5 w-6 bg-[#FE5238]" /> Realized PPS return</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-6 border border-[#1E1E1E]/40" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1E1E1E33 0, #1E1E1E33 1px, transparent 1px, transparent 6px)' }} /> Variance</span>
            </div>

            <div className="sr-only">
                <table>
                    <caption>Expected and realized cumulative return data</caption>
                    <thead><tr><th>Date</th><th>Expected return</th><th>Realized return</th></tr></thead>
                    <tbody>{filtered.map((point) => (
                        <tr key={point.recordedAt}><td>{point.label}</td><td>{point.target}%</td><td>{point.actual}%</td></tr>
                    ))}</tbody>
                </table>
            </div>
        </section>
    );
}

function ChartMetric({ label, value, className }: { label: string; value: string; className: string }) {
    return (
        <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#1E1E1E]/70">{label}</div>
            <div className={`mt-1 font-mono text-base font-bold tabular-nums md:text-lg ${className}`}>{value}</div>
        </div>
    );
}
