import { ScanEye } from 'lucide-react';
import type { DriftPoint } from '@/lib/dashboard';

interface DriftChartProps {
    vaultName: string | null;
    points: DriftPoint[];
}

export function DriftChart({ vaultName, points }: DriftChartProps) {
    if (points.length === 0) {
        return (
            <div className="min-h-[360px] flex flex-col items-center justify-center text-center border-[1.5px] border-dashed border-[#D6D6D6]/30 p-8">
                <ScanEye className="w-8 h-8 text-[#FE5238] mb-4" />
                <h2 className="text-xl font-black uppercase">Awaiting drift baseline</h2>
                <p className="font-mono text-xs uppercase text-[#D6D6D6]/60 mt-2 max-w-lg">
                    At least three valid daily observations spanning seven days are required before realized APY is compared with interval-matched target APY.
                </p>
            </div>
        );
    }

    const current = points[points.length - 1];
    const driftPercent = current.target > 0
        ? ((current.actual - current.target) / current.target) * 100
        : 0;
    const maxYield = Math.max(0, ...points.flatMap((point) => [point.target, point.actual]));
    const minYield = Math.min(0, ...points.flatMap((point) => [point.target, point.actual]));
    const yieldRange = Math.max(1, maxYield - minYield);
    const zeroPosition = ((0 - minYield) / yieldRange) * 100;
    const barStyle = (value: number) => ({
        bottom: `${value >= 0 ? zeroPosition : zeroPosition - (Math.abs(value) / yieldRange) * 100}%`,
        height: `${(Math.abs(value) / yieldRange) * 100}%`,
    });

    return (
        <div className="w-full flex flex-col h-full text-[#D6D6D6]" role="region" aria-label="Strategy Drift Chart">
            <div className="sr-only">
                <table>
                    <caption>{vaultName} strategy drift data</caption>
                    <thead><tr><th>Date</th><th>Target APY</th><th>Realized APY</th></tr></thead>
                    <tbody>{points.map((point) => (
                        <tr key={point.label}><td>{point.label}</td><td>{point.target}%</td><td>{point.actual}%</td></tr>
                    ))}</tbody>
                </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                        <ScanEye className="w-6 h-6 text-[#FE5238]" /> Yield Performance
                    </h2>
                    <p className="font-mono text-xs uppercase font-bold text-[#D6D6D6]/70 mt-1">
                        {vaultName}: target vs annualized on-chain PPS growth
                    </p>
                </div>
                <div className="border-[1.5px] border-[#FE5238] p-3 border-dashed">
                    <div className="font-mono text-xs uppercase font-bold text-[#FE5238] mb-1">Latest observation</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs font-bold">
                        <span>Target {current.target.toFixed(2)}%</span>
                        <span className="text-[#FE6A54]">Realized {current.actual.toFixed(2)}%</span>
                    </div>
                    <div className="text-2xl font-black text-[#FE5238] tracking-tighter mt-2">{driftPercent.toFixed(1)}% drift</div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs font-bold uppercase" aria-hidden="true">
                <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 border-[1.5px] border-[#D6D6D6]" /> Target APY
                </span>
                <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 bg-[#FE5238]" /> Realized APY
                </span>
            </div>

            <div className="w-full mt-5 overflow-x-auto pb-2" aria-hidden="true">
                <div className="min-w-max px-1">
                    <div className="relative flex h-56 items-stretch gap-4 border-y-[1.5px] border-[#D6D6D6]/20">
                        <div
                            className="absolute inset-x-0 z-20 border-t-[1.5px] border-dashed border-[#D6D6D6]/70"
                            style={{ bottom: `${zeroPosition}%` }}
                        >
                            <span className="absolute left-0 -translate-y-full bg-[#1E1E1E] pr-2 font-mono text-xs font-bold text-[#D6D6D6]">
                                0% baseline
                            </span>
                        </div>
                        {points.map((point) => (
                            <div key={point.label} className="relative z-10 h-full w-24 shrink-0">
                                <div
                                    style={barStyle(point.target)}
                                    className="absolute left-[26px] w-4 min-h-px border-[1.5px] border-[#D6D6D6] bg-[#1E1E1E]"
                                />
                                <div
                                    style={barStyle(point.actual)}
                                    className="absolute right-[26px] w-4 min-h-px bg-[#FE5238]"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 pt-3">
                        {points.map((point) => (
                            <div key={point.label} className="w-24 shrink-0 text-center font-mono text-xs font-bold">
                                <div className="text-[#D6D6D6]">{point.label}</div>
                                <div className="mt-2 text-[#D6D6D6]/80">T {point.target.toFixed(2)}%</div>
                                <div className="text-[#FE6A54]">R {point.actual.toFixed(2)}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
