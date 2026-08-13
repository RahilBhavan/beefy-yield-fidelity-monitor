import { HeatMap } from '@/components/HeatMap';
import { DriftChart } from '@/components/DriftChart';
import { TriangleAlert, CopyMinus, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getDashboardData } from '@/lib/dashboard';
import { baseChain } from '@/lib/chains';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Dashboard',
    description: 'On-chain Beefy vault coverage, price-per-share drift, and data freshness on Base.',
};

const compactCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
});

export default async function Dashboard() {
    const data = await getDashboardData();
    const isReady = data.quality === 'ready';
    const isCollecting = data.quality === 'collecting';
    const hasObservations = data.quality !== 'unavailable';
    const qualityLabel = isReady
        ? 'Analysis Ready / Base'
        : isCollecting
            ? 'Collecting Data / Base'
            : 'Data Unavailable';
    const priorityVault = data.flaggedVaults[0];
    const decisionTitle = !hasObservations
        ? 'Restore the data pipeline before making portfolio conclusions.'
        : !isReady
            ? 'Hold strategy conclusions while the seven-day baseline matures.'
            : priorityVault
                ? `Prioritize review of ${priorityVault.name}.`
                : 'No strategy currently breaches the -5% review threshold.';
    const decisionDetail = !hasObservations
        ? data.message
        : !isReady
            ? `${data.trackedVaults} active vaults are being monitored, but none yet meet the minimum observation window.`
            : priorityVault
                ? `${data.flaggedVaults.length} ${data.flaggedVaults.length === 1 ? 'vault is' : 'vaults are'} below target, representing ${compactCurrency.format(data.underperformingTvl)} in TVL. The largest relative exception is ${priorityVault.driftPercent.toFixed(1)}%.`
                : `${data.readyVaults} vaults meet the evidence gate and none require exception review.`;

    return (
        <div className="flex flex-col w-full bg-[#D6D6D6] text-[#1E1E1E]">

            {/* Dashboard Header */}
            <section className="w-full flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end pb-4 pt-10 px-6 md:px-10 border-b-[1.5px] border-[#1E1E1E]">
                <div>
                    <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#8F2415] mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#8F2415]"></span>
                        Base Vault Analytics
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                        Yield<br />Monitor.
                    </h1>
                </div>
                <div className="text-left sm:text-right">
                    <div className="font-mono text-xs font-bold uppercase text-[#1E1E1E]/75">Status</div>
                    <div className="font-mono text-sm font-bold uppercase">{qualityLabel}</div>
                    <div className="mt-3 flex flex-wrap gap-3 sm:justify-end font-mono text-xs uppercase font-bold">
                        <Link href="/methodology" className="underline hover:text-[#FE5238]">Methodology</Link>
                        {hasObservations ? (
                            <a href="/api/export" className="underline hover:text-[#FE5238]">Export observations</a>
                        ) : (
                            <span className="opacity-50" aria-disabled="true">Export unavailable</span>
                        )}
                    </div>
                </div>
            </section>

            <section aria-labelledby="management-summary" className="border-b-[1.5px] border-[#1E1E1E] bg-[#EBEBEB]">
                <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
                    <div className="p-6 md:p-10 lg:border-r-[1.5px] border-[#1E1E1E]">
                        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#8F2415]">Management summary</p>
                        <h2 id="management-summary" className="mt-3 max-w-4xl text-3xl md:text-5xl font-black tracking-tighter leading-tight">
                            {decisionTitle}
                        </h2>
                        <p className="mt-5 max-w-3xl font-mono text-sm leading-relaxed text-[#1E1E1E]/75">{decisionDetail}</p>
                    </div>
                    <div className="p-6 md:p-10 bg-[#D6D6D6]">
                        <div className="flex items-center gap-3">
                            <ClipboardCheck className="h-6 w-6 text-[#8F2415]" aria-hidden="true" />
                            <h3 className="font-black uppercase">Recommended action</h3>
                        </div>
                        <p className="mt-4 font-mono text-sm leading-relaxed">
                            {!hasObservations
                                ? 'Investigate database configuration and ingestion health. Do not present performance findings until observations resume.'
                                : !isReady
                                    ? 'Continue daily collection and verify snapshot coverage. Reassess once at least three valid observations span seven days.'
                                    : priorityVault
                                        ? `Validate ${priorityVault.name}'s PPS history and harvest cadence, then compare the annualized gap with its ${priorityVault.confidence}-confidence measurement window.`
                                        : 'Continue monitoring; no intervention is supported by the current threshold and evidence window.'}
                        </p>
                    </div>
                </div>
                <dl className="grid grid-cols-2 lg:grid-cols-3 border-t-[1.5px] border-[#1E1E1E] bg-[#1E1E1E] text-[#D6D6D6]">
                    <SummaryMetric label="Analysis coverage" value={`${data.analysisCoveragePercent.toFixed(0)}%`} detail={`${data.readyVaults} of ${data.trackedVaults} vaults`} />
                    <SummaryMetric label="Latest snapshot coverage" value={`${data.latestSnapshotCoveragePercent.toFixed(0)}%`} detail="Valid observations / active vaults" />
                    <SummaryMetric label="Capital analyzed" value={compactCurrency.format(data.analyzedTvl)} detail="TVL passing the evidence gate" />
                    <SummaryMetric label="Expected APY" value={isReady ? `${(data.portfolioExpectedApy * 100).toFixed(2)}%` : '—'} detail="TVL-weighted, interval matched" />
                    <SummaryMetric label="Realized APY" value={isReady ? `${(data.portfolioActualApy * 100).toFixed(2)}%` : '—'} detail="TVL-weighted PPS growth" />
                    <SummaryMetric
                        label="Annualized yield gap"
                        value={isReady ? compactCurrency.format(data.annualizedYieldGapUsd) : '—'}
                        detail={isReady ? 'Expected less realized, extrapolated' : 'Available after baseline'}
                    />
                </dl>
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
                        <div className="text-6xl font-black tracking-tighter mb-2">{isReady ? data.flaggedVaults.length : '—'}</div>
                        <div className="font-mono text-xs font-bold uppercase tracking-wider mb-6 text-[#1E1E1E]/75">
                            {isReady
                                ? 'Vaults with realized PPS yield more than 5% below target'
                                : isCollecting
                                    ? 'Anomaly review begins when enough PPS history is collected'
                                    : 'Anomaly review is unavailable without observation data'}
                        </div>
                        {isReady ? (
                            <Link href="/dashboard/strategies" className="w-full flex justify-between items-center py-3 border-[1.5px] border-[#1E1E1E] px-4 font-mono text-xs font-bold uppercase hover:bg-[#1E1E1E] hover:text-[#EBEBEB] transition-colors">
                                Review Exceptions <CopyMinus className="w-4 h-4" />
                            </Link>
                        ) : (
                            <div className="w-full py-3 border-[1.5px] border-[#1E1E1E]/50 px-4 font-mono text-xs font-bold uppercase text-[#4A4A4A]">
                                {isCollecting ? 'Analysis in progress' : 'Review unavailable'}
                            </div>
                        )}
                    </div>

                    <div className="p-8 flex-1">
                        <h3 className="font-bold text-lg uppercase tracking-tight mb-3">Data Status</h3>
                        <p className="font-mono text-xs uppercase leading-relaxed text-[#1E1E1E]/75">{data.message}</p>
                        {data.updatedAt && (
                            <p className="font-mono text-xs uppercase mt-5 text-[#1E1E1E]/70">
                                Latest PPS: {new Date(data.updatedAt).toLocaleString()}
                            </p>
                        )}
                        {data.latestBlockNumber && (
                            <a
                                href={`${baseChain.explorerUrl}/block/${data.latestBlockNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-xs uppercase mt-2 block underline hover:text-[#8F2415]"
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
                    isLive={hasObservations}
                />
            </section>

        </div>
    );
}

function SummaryMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <div className="p-5 md:p-7 border-r border-b border-[#D6D6D6]/25">
            <dt className="font-mono text-xs font-bold uppercase text-[#D6D6D6]/70">{label}</dt>
            <dd className="mt-2 text-3xl md:text-4xl font-black tracking-tighter">{value}</dd>
            <dd className="mt-2 font-mono text-xs text-[#D6D6D6]/60">{detail}</dd>
        </div>
    );
}
