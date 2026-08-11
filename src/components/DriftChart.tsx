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
    const maxYield = Math.max(1, ...points.flatMap((point) => [point.target, point.actual]));

    return (
        <div className="w-full flex flex-col h-full text-[#D6D6D6]" role="region" aria-label="Strategy Drift Chart">
            <div className="sr-only">
                <h3>{vaultName} strategy drift data</h3>
                <table>
                    <thead><tr><th>Date</th><th>Target APY</th><th>Realized APY</th></tr></thead>
                    <tbody>{points.map((point) => (
                        <tr key={point.label}><td>{point.label}</td><td>{point.target}%</td><td>{point.actual}%</td></tr>
                    ))}</tbody>
                </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-10 gap-4" aria-hidden="true">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                        <ScanEye className="w-6 h-6 text-[#FE5238]" /> Strategy Drift Vector
                    </h2>
                    <p className="font-mono text-[10px] uppercase font-bold text-[#D6D6D6]/60 mt-1">
                        {vaultName}: target vs annualized on-chain PPS growth
                    </p>
                </div>
                <div className="border-[1.5px] border-[#FE5238] p-3 max-w-[200px] border-dashed">
                    <div className="font-mono text-[10px] uppercase font-bold text-[#FE5238] mb-1">Relative Drift</div>
                    <div className="text-3xl font-black text-[#FE5238] tracking-tighter">{driftPercent.toFixed(1)}%</div>
                </div>
            </div>

            <div className="relative flex-1 min-h-[300px] w-full mt-4 flex items-end justify-between gap-2 border-b-[1.5px] border-[#D6D6D6]/30 pb-4 overflow-x-auto" aria-hidden="true">
                {points.map((point) => (
                    <div key={point.label} className="relative z-10 flex flex-col items-center justify-end h-full min-w-12 flex-1 group">
                        <div className="absolute top-0 opacity-0 group-hover:opacity-100 bg-[#EBEBEB] text-[#1E1E1E] font-mono text-[10px] font-bold uppercase p-2 border-[1.5px] border-[#1E1E1E] whitespace-nowrap z-20 pointer-events-none -translate-y-full">
                            Target: {point.target.toFixed(2)}%<br />Realized: {point.actual.toFixed(2)}%
                        </div>
                        <div className="relative w-full max-w-[40px] h-[260px] flex items-end">
                            <div style={{ height: `${Math.max(0, point.target / maxYield) * 100}%` }} className="absolute bottom-0 w-full border-[1.5px] border-[#D6D6D6]/50" />
                            <div style={{ height: `${Math.max(0, point.actual / maxYield) * 100}%` }} className="absolute bottom-0 w-full bg-[#D6D6D6] hover:bg-[#FE5238]" />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[#D6D6D6]/60 mt-4 whitespace-nowrap">{point.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
