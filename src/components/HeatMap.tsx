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
            <div className="flex items-center justify-between px-6 md:px-10 py-6 border-b-[1.5px] border-[#1E1E1E] bg-[#D6D6D6]">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-[#1E1E1E] flex items-center gap-2">
                        <Target className="w-6 h-6 text-[#FE5238]" /> Network Coverage
                    </h2>
                    <p className="font-mono text-[10px] uppercase font-bold text-[#1E1E1E]/60 mt-1">Current MVP monitors Base only.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-[#EBEBEB] border-[1.5px] border-[#1E1E1E] px-4 py-2 font-mono text-xs font-bold uppercase text-[#1E1E1E]">
                    <Activity className="w-3.5 h-3.5 text-[#FE5238]" /> {isLive ? 'PPS data available' : 'Awaiting data'}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#1E1E1E] text-[#D6D6D6]">
                <Metric label="Active Base Vaults" value={trackedVaults.toString()} />
                <Metric label="Analysis Ready" value={readyVaults.toString()} />
                <Metric label="Tracked TVL" value={currency.format(totalTvl)} />
                <Metric label="TVL-Weighted APY" value={`${(weightedApy * 100).toFixed(2)}%`} />
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-8 border-b sm:border-b-0 sm:border-r last:border-r-0 border-[#D6D6D6]/30">
            <div className="font-mono text-[10px] uppercase font-bold opacity-60">{label}</div>
            <div className="text-4xl font-black tracking-tighter mt-3">{value}</div>
        </div>
    );
}
