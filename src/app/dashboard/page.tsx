import { HeatMap } from '@/components/HeatMap';
import { DriftChart } from '@/components/DriftChart';
import { TriangleAlert, CopyMinus } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getDashboardData } from '@/lib/dashboard';
import { baseChain } from '@/lib/chains';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Dashboard | Beefy Yield-Fidelity',
    description: 'Command center and system analytics.',
};

export default async function Dashboard() {
    const data = await getDashboardData();
    const isLive = data.status === 'live';

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
                <div className="text-right block">
                    <div className="font-mono text-xs font-bold uppercase opacity-60">Status</div>
                    <div className="font-mono text-sm font-bold uppercase">{isLive ? 'Live / Base' : 'Not Ready'}</div>
                    <div className="mt-3 flex gap-3 justify-end font-mono text-[10px] uppercase font-bold">
                        <Link href="/methodology" className="underline hover:text-[#FE5238]">Methodology</Link>
                        <a href="/api/export" className="underline hover:text-[#FE5238]">Export CSV</a>
                    </div>
                </div>
            </section>

            {/* Primary Analytics Grid */}
            <section className="w-full grid grid-cols-1 xl:grid-cols-3 border-b-[1.5px] border-[#1E1E1E] bg-[#1E1E1E]">

                {/* Drift Chart takes up 2 columns on large screens */}
                <div className="xl:col-span-2 border-b-[1.5px] xl:border-b-0 xl:border-r-[1.5px] border-[#D6D6D6]/30 px-6 md:px-10 py-8">
                    <DriftChart vaultName={data.chartVaultName} points={data.driftPoints} />
                </div>

                {/* Quick Stats Sidebar */}
                <div className="flex flex-col bg-[#EBEBEB] text-[#1E1E1E]">
                    <div className="p-8 border-b-[1.5px] border-[#1E1E1E] hover:bg-[#FE5238] hover:text-[#1E1E1E] transition-colors group">
                        <TriangleAlert className="w-8 h-8 text-[#FE5238] group-hover:text-[#1E1E1E] mb-6" />
                        <div className="text-6xl font-black tracking-tighter mb-2">{data.flaggedVaults.length}</div>
                        <div className="font-mono text-[10px] font-bold uppercase tracking-wider mb-6 opacity-70">
                            Vaults with realized PPS yield more than 5% below target
                        </div>
                        <Link href="/dashboard/strategies" className="w-full flex justify-between items-center py-3 border-[1.5px] border-[#1E1E1E] px-4 font-mono text-xs font-bold uppercase hover:bg-[#1E1E1E] hover:text-[#EBEBEB] transition-colors">
                            Review Anomalies <CopyMinus className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="p-8 flex-1">
                        <h3 className="font-bold text-lg uppercase tracking-tight mb-3">Data Status</h3>
                        <p className="font-mono text-xs uppercase leading-relaxed opacity-70">{data.message}</p>
                        {data.updatedAt && (
                            <p className="font-mono text-[10px] uppercase mt-5 opacity-50">
                                Latest PPS: {new Date(data.updatedAt).toLocaleString()}
                            </p>
                        )}
                        {data.latestBlockNumber && (
                            <a
                                href={`${baseChain.explorerUrl}/block/${data.latestBlockNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-[10px] uppercase mt-2 block underline hover:text-[#FE5238]"
                            >
                                Block {data.latestBlockNumber} · {data.providerLabel ?? 'RPC'}
                            </a>
                        )}
                    </div>
                </div>

            </section>

            {/* Heat Map Section */}
            <section className="w-full">
                <HeatMap
                    trackedVaults={data.trackedVaults}
                    readyVaults={data.readyVaults}
                    totalTvl={data.totalTvl}
                    weightedApy={data.weightedApy}
                    isLive={isLive}
                />
            </section>

        </div>
    );
}
