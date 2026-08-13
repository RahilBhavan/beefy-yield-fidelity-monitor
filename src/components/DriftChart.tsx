'use client';

import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { DriftPoint } from '@/lib/dashboard';

interface DriftChartProps {
    vaultName: string | null;
    points: DriftPoint[];
}

type Range = 7 | 14 | 30 | 90;

const width = 820;
const height = 300;
const padding = { top: 24, right: 24, bottom: 42, left: 62 };

export function DriftChart({ vaultName, points }: DriftChartProps) {
    const [range, setRange] = useState<Range>(30);

    const filtered = useMemo(() => {
        if (points.length === 0) return [];
        const latest = Math.max(...points.map((point) => Date.parse(point.recordedAt)));
        const cutoff = latest - range * 86_400_000;
        return points.filter((point) => Date.parse(point.recordedAt) >= cutoff);
    }, [points, range]);

    if (points.length === 0) return null;

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
        <section aria-labelledby="performance-chart-title" className="rounded-sm border border-[#C6C8C8] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.05)] md:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#5E6670]">Performance variance</p>
                    <h2 id="performance-chart-title" className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight md:text-2xl">
                        <TrendingUp className="h-5 w-5 text-[#245B8A]" aria-hidden="true" />
                        Expected vs realized return
                    </h2>
                    <p className="mt-1 text-sm text-[#626A72]">{vaultName} · cumulative return from interval-matched observations</p>
                </div>
                <div className="flex rounded-sm border border-[#B6B9BA] bg-[#F1F2F2] p-0.5" aria-label="Chart date range">
                    {([7, 14, 30, 90] as Range[]).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setRange(option)}
                            className={`min-w-10 px-2.5 py-1.5 font-mono text-[11px] font-bold ${range === option ? 'bg-[#1E1E1E] text-white' : 'text-[#586169] hover:bg-white'}`}
                            aria-pressed={range === option}
                        >
                            {option}D
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[#E0E1E1] py-4">
                <ChartMetric label="Expected" value={`${latestPoint.target.toFixed(3)}%`} className="text-[#245B8A]" />
                <ChartMetric label="Realized" value={`${latestPoint.actual.toFixed(3)}%`} className="text-[#C4482F]" />
                <ChartMetric label="Relative drift" value={`${relativeDrift.toFixed(1)}%`} className={relativeDrift <= -5 ? 'text-[#8B2F1D]' : 'text-[#24313B]'} />
            </div>

            <div className="mt-5 overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[640px] w-full" role="img" aria-labelledby="chart-svg-title chart-svg-description">
                    <title id="chart-svg-title">Cumulative expected and realized return for {vaultName}</title>
                    <desc id="chart-svg-description">A line chart comparing expected return based on interval-matched APY with realized on-chain price-per-share growth.</desc>
                    {tickValues.map((tick) => (
                        <g key={tick}>
                            <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="#D9DCDD" strokeWidth="1" />
                            <text x={padding.left - 10} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="#68717A" fontFamily="monospace">{tick.toFixed(2)}%</text>
                        </g>
                    ))}
                    {gapArea && <polygon points={gapArea} fill="#E8EEF2" opacity="0.75" />}
                    <path d={line('target')} fill="none" stroke="#245B8A" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    <path d={line('actual')} fill="none" stroke="#D25338" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    {filtered.map((point, index) => (
                        <g key={point.recordedAt}>
                            <circle cx={x(index)} cy={y(point.target)} r="4" fill="white" stroke="#245B8A" strokeWidth="2">
                                <title>{point.label}: expected {point.target.toFixed(3)}%</title>
                            </circle>
                            <circle cx={x(index)} cy={y(point.actual)} r="4" fill="white" stroke="#D25338" strokeWidth="2">
                                <title>{point.label}: realized {point.actual.toFixed(3)}%</title>
                            </circle>
                        </g>
                    ))}
                    {xLabels.map((index) => (
                        <text key={index} x={x(index)} y={height - 13} textAnchor="middle" fontSize="11" fill="#68717A" fontFamily="monospace">
                            {filtered[index]?.label}
                        </text>
                    ))}
                </svg>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-5 text-xs text-[#586169]">
                <span className="inline-flex items-center gap-2"><span className="h-0.5 w-6 bg-[#245B8A]" /> Expected return</span>
                <span className="inline-flex items-center gap-2"><span className="h-0.5 w-6 bg-[#D25338]" /> Realized PPS return</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-6 bg-[#E8EEF2]" /> Variance</span>
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
            <div className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#68717A]">{label}</div>
            <div className={`mt-1 font-mono text-base font-bold tabular-nums md:text-lg ${className}`}>{value}</div>
        </div>
    );
}
