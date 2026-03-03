import { HeatMap } from '@/components/HeatMap';
import { DriftChart } from '@/components/DriftChart';
import { TriangleAlert, CopyMinus } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
    return (
        <div className="flex flex-col w-full bg-[#D6D6D6] text-[#1E1E1E]">

            {/* Dashboard Header */}
            <section className="w-full flex justify-between items-end pb-4 pt-10 px-6 md:px-10 border-b-[1.5px] border-[#1E1E1E]">
                <div>
                    <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#FE5238] mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#FE5238]"></span>
                        System Analytics
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                        Command<br />Center.
                    </h1>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="font-mono text-xs font-bold uppercase opacity-60">Status</div>
                    <div className="font-mono text-sm font-bold uppercase">Online / Sync</div>
                </div>
            </section>

            {/* Primary Analytics Grid */}
            <section className="w-full grid grid-cols-1 xl:grid-cols-3 border-b-[1.5px] border-[#1E1E1E] bg-[#1E1E1E]">

                {/* Drift Chart takes up 2 columns on large screens */}
                <div className="xl:col-span-2 border-b-[1.5px] xl:border-b-0 xl:border-r-[1.5px] border-[#D6D6D6]/30 px-6 md:px-10 py-8">
                    <DriftChart />
                </div>

                {/* Quick Stats Sidebar */}
                <div className="flex flex-col bg-[#EBEBEB] text-[#1E1E1E]">
                    <div className="p-8 border-b-[1.5px] border-[#1E1E1E] hover:bg-[#FE5238] hover:text-[#1E1E1E] transition-colors group">
                        <TriangleAlert className="w-8 h-8 text-[#FE5238] group-hover:text-[#1E1E1E] mb-6" />
                        <div className="text-6xl font-black tracking-tighter mb-2">12</div>
                        <div className="font-mono text-[10px] font-bold uppercase tracking-wider mb-6 opacity-70">
                            Vaults flagged for severe Price-Per-Share Drift (&gt;5%)
                        </div>
                        <Link href="/dashboard/strategies" className="w-full flex justify-between items-center py-3 border-[1.5px] border-[#1E1E1E] px-4 font-mono text-xs font-bold uppercase hover:bg-[#1E1E1E] hover:text-[#EBEBEB] transition-colors">
                            Review Anomalies <CopyMinus className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="p-8 flex-1">
                        <h3 className="font-bold text-lg uppercase tracking-tight mb-6">Efficiency Rank</h3>
                        <div className="space-y-4 font-mono text-sm uppercase font-bold">
                            <div className="flex items-center justify-between border-b-[1.5px] border-[#1E1E1E]/20 pb-2">
                                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500"></span>Base</span>
                                <span>92/100</span>
                            </div>
                            <div className="flex items-center justify-between border-b-[1.5px] border-[#1E1E1E]/20 pb-2">
                                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500"></span>Arbitrum</span>
                                <span>85/100</span>
                            </div>
                            <div className="flex items-center justify-between border-b-[1.5px] border-[#1E1E1E]/20 pb-2">
                                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-500"></span>Optimism</span>
                                <span>68/100</span>
                            </div>
                        </div>
                    </div>
                </div>

            </section>

            {/* Heat Map Section */}
            <section className="w-full">
                <HeatMap />
            </section>

        </div>
    );
}
