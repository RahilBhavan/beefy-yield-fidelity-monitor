import { Activity, Target } from 'lucide-react';

interface NetworkCoverageProps {
    trackedVaults: number;
    readyVaults: number;
    totalTvl: number;
    weightedApy: number;
    isLive: boolean;
}

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
});

export function HeatMap({ trackedVaults, readyVaults, totalTvl, weightedApy, isLive }: NetworkCoverageProps) {
    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 md:px-10 py-6 border-b-[1.5px] border-[#1E1E1E] bg-[#D6D6D6]">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-[#1E1E1E] flex items-center gap-2">
                        <Target className="w-6 h-6 text-[#FE5238]" /> Portfolio Coverage
                    </h2>
                    <p className="font-mono text-xs uppercase font-bold text-[#1E1E1E]/70 mt-1">Current MVP monitors Base only.</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto bg-[#EBEBEB] border-[1.5px] border-[#1E1E1E] px-4 py-2 font-mono text-xs font-bold uppercase text-[#8F2016]">
                    <Activity className="w-3.5 h-3.5" /> {isLive ? 'Live PPS coverage' : 'PPS coverage pending'}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#1E1E1E] text-[#D6D6D6]">
                <Metric label="Active Base Vaults" value={trackedVaults.toString()} className="border-b sm:border-r lg:border-b-0" />
                <Metric label="Analysis Ready" value={readyVaults.toString()} className="border-b lg:border-r lg:border-b-0" />
                <Metric label="Tracked TVL" value={currency.format(totalTvl)} className="border-b sm:border-b-0 sm:border-r" />
                <Metric label="TVL-Weighted APY" value={`${(weightedApy * 100).toFixed(2)}%`} />
            </div>
        </div>
    );
}

function Metric({ label, value, className = '' }: { label: string; value: string; className?: string }) {
    return (
        <div className={`p-8 border-[#D6D6D6]/30 ${className}`}>
            <div className="font-mono text-xs uppercase font-bold text-[#D6D6D6]/70">{label}</div>
            <div className="text-4xl font-black tracking-tighter mt-3">{value}</div>
        </div>
    );
}
