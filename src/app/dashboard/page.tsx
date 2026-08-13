import type { Metadata } from 'next';
import Link from 'next/link';
import {
    Activity,
    ArrowUpRight,
    Check,
    Clock3,
    Database,
    Download,
    ExternalLink,
    ShieldAlert,
} from 'lucide-react';
import { DriftChart } from '@/components/DriftChart';
import { PortfolioTable } from '@/components/PortfolioTable';
import { getDashboardData } from '@/lib/dashboard';
import { baseChain } from '@/lib/chains';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Dashboard',
    description: 'Portfolio yield, price-per-share performance, exception review, and data quality for active Beefy vaults on Base.',
};

const compactCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
});

export default async function Dashboard() {
    const data = await getDashboardData();
    const asOf = new Date().toISOString();
    const isReady = data.quality === 'ready';
    const isCollecting = data.quality === 'collecting';
    const hasObservations = data.quality !== 'unavailable';
    const priorityVault = data.flaggedVaults[0];
    const freshnessHours = data.updatedAt
        ? Math.max(0, (Date.parse(asOf) - Date.parse(data.updatedAt)) / 3_600_000)
        : null;

    const decisionTitle = !hasObservations
        ? 'Restore the data pipeline before drawing portfolio conclusions.'
        : !isReady
            ? 'The portfolio is fully covered; performance analysis is still maturing.'
            : priorityVault
                ? `${priorityVault.name} is the highest-priority performance exception.`
                : 'No analyzed strategy currently breaches the review threshold.';
    const decisionDetail = !hasObservations
        ? data.message
        : !isReady
            ? `${data.trackedVaults} vaults have current observations. Continue collection until the three-observation and seven-day controls both pass.`
            : priorityVault
                ? `${data.flaggedVaults.length} ${data.flaggedVaults.length === 1 ? 'vault is' : 'vaults are'} below target, representing ${compactCurrency.format(data.underperformingTvl)} in TVL.`
                : `${data.readyVaults} vaults pass the evidence gate with no variance below -5%.`;

    return (
        <div className="min-h-full bg-[#ECEDEB] text-[#202326]">
            <header className="border-b border-[#BFC2C1] bg-[#F7F7F5] px-5 py-5 md:px-8 md:py-6">
                <div className="mx-auto flex max-w-[1500px] flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge quality={data.quality} />
                            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#667078]">Base · Chain 8453</span>
                        </div>
                        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-5xl">Portfolio yield monitor</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#606970] md:text-base">
                            Reported yield, realized vault-share growth, and evidence quality in one decision surface.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/methodology" className="inline-flex h-10 items-center gap-2 border border-[#AEB2B2] bg-white px-3.5 text-sm font-semibold hover:border-[#5D666D]">
                            Methodology <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        {hasObservations && (
                            <a href="/api/export" className="inline-flex h-10 items-center gap-2 bg-[#202326] px-3.5 text-sm font-semibold text-white hover:bg-[#34383C]">
                                <Download className="h-4 w-4" aria-hidden="true" /> Export data
                            </a>
                        )}
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8 md:py-8">
                <section aria-label="Portfolio and data quality metrics" className="grid gap-4 xl:grid-cols-2">
                    <MetricGroup label="Portfolio">
                        <Metric label="Active vaults" value={data.trackedVaults.toString()} detail="Base strategies" />
                        <Metric label="Tracked TVL" value={compactCurrency.format(data.totalTvl)} detail="Current market value" />
                        <Metric label="Weighted APY" value={`${(data.weightedApy * 100).toFixed(2)}%`} detail="Current reported rate" />
                    </MetricGroup>
                    <MetricGroup label="Data quality">
                        <Metric label="Snapshot coverage" value={`${data.latestSnapshotCoveragePercent.toFixed(0)}%`} detail={`${data.portfolioVaults.filter((vault) => vault.latestRecordedAt).length} of ${data.trackedVaults} vaults`} tone={data.latestSnapshotCoveragePercent >= 95 ? 'healthy' : 'warning'} />
                        <Metric label="Analysis ready" value={`${data.analysisCoveragePercent.toFixed(0)}%`} detail={`${data.readyVaults} of ${data.trackedVaults} vaults`} tone={isReady ? 'healthy' : isCollecting ? 'collecting' : 'warning'} />
                        <Metric label="Freshness" value={freshnessHours === null ? '—' : relativeAge(data.updatedAt, asOf)} detail={freshnessHours !== null && freshnessHours < 36 ? 'Within 36h objective' : 'Requires attention'} tone={freshnessHours !== null && freshnessHours < 36 ? 'healthy' : 'warning'} />
                    </MetricGroup>
                </section>

                <section aria-labelledby="management-insight" className="mt-5 grid overflow-hidden border border-[#BFC2C1] bg-white lg:grid-cols-[1.55fr_1fr]">
                    <div className="p-5 md:p-7 lg:border-r lg:border-[#C8CACA]">
                        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#5E6670]">Management insight</p>
                        <h2 id="management-insight" className="mt-2 max-w-4xl text-2xl font-black tracking-[-0.025em] md:text-3xl">{decisionTitle}</h2>
                        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[#5D666D]">{decisionDetail}</p>
                        {isReady && (
                            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[#E0E1E1] pt-5 sm:grid-cols-4">
                                <InlineMetric label="Capital analyzed" value={compactCurrency.format(data.analyzedTvl)} />
                                <InlineMetric label="Expected APY" value={`${(data.portfolioExpectedApy * 100).toFixed(2)}%`} />
                                <InlineMetric label="Realized APY" value={`${(data.portfolioActualApy * 100).toFixed(2)}%`} />
                                <InlineMetric label="Annualized gap" value={compactCurrency.format(data.annualizedYieldGapUsd)} />
                            </dl>
                        )}
                    </div>
                    <div className="bg-[#F2F3F1] p-5 md:p-7">
                        <div className="flex items-center gap-2 text-[#30404B]">
                            <Activity className="h-5 w-5" aria-hidden="true" />
                            <h3 className="text-sm font-black uppercase tracking-wide">Recommended action</h3>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-[#4F5960]">
                            {!hasObservations
                                ? 'Investigate database configuration and ingestion health before presenting performance findings.'
                                : !isReady
                                    ? 'Continue daily collection and verify coverage. Reassess automatically when both evidence controls pass.'
                                    : priorityVault
                                        ? `Validate ${priorityVault.name}'s provenance and operating cadence before escalating the variance.`
                                        : 'Continue monitoring. The current evidence does not support intervention.'}
                        </p>
                    </div>
                </section>

                <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.75fr)]">
                    {isReady ? (
                        <DriftChart vaultName={data.chartVaultName} points={data.driftPoints} />
                    ) : (
                        <CollectionProgress
                            available={hasObservations}
                            observationDays={data.uniqueObservationDays}
                            collectionDays={data.collectionDays}
                            coverage={data.latestSnapshotCoveragePercent}
                            estimatedReadyAt={data.estimatedReadyAt}
                            message={data.message}
                        />
                    )}

                    <aside className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                        <section aria-labelledby="exception-review-title" className="border border-[#C6C8C8] bg-white p-5 md:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#5E6670]">Exception review</p>
                                    <h2 id="exception-review-title" className="mt-1 text-xl font-black">{isReady ? `${data.flaggedVaults.length} require review` : 'Pending evidence gate'}</h2>
                                </div>
                                <ShieldAlert className={`h-6 w-6 ${data.flaggedVaults.length > 0 ? 'text-[#A53B26]' : 'text-[#68717A]'}`} aria-hidden="true" />
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-[#5D666D]">
                                {isReady
                                    ? priorityVault ? `${priorityVault.name} has the largest relative shortfall at ${priorityVault.driftPercent.toFixed(1)}%.` : 'No analyzed vault is more than 5% below its interval-matched target.'
                                    : 'Exceptions appear only after three valid observations span at least seven days.'}
                            </p>
                            <Link href="/dashboard/strategies" className={`mt-5 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4 ${isReady ? 'text-[#245B8A]' : 'pointer-events-none text-[#868B8E]'}`} aria-disabled={!isReady}>
                                Open exception review <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </section>

                        <section aria-labelledby="provenance-title" className="border border-[#C6C8C8] bg-[#202326] p-5 text-white md:p-6">
                            <div className="flex items-center gap-2 text-[#C8D0D5]">
                                <Database className="h-5 w-5" aria-hidden="true" />
                                <h2 id="provenance-title" className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">Latest provenance</h2>
                            </div>
                            <dl className="mt-5 space-y-4 text-sm">
                                <ProvenanceRow label="Recorded" value={data.updatedAt ? new Date(data.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC' : 'Unavailable'} />
                                <ProvenanceRow label="Provider" value={data.providerLabel ?? 'Unavailable'} />
                                <ProvenanceRow label="Coverage" value={`${data.latestSnapshotCoveragePercent.toFixed(0)}% valid`} />
                            </dl>
                            {data.latestBlockNumber && (
                                <a href={`${baseChain.explorerUrl}/block/${data.latestBlockNumber}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-mono text-xs font-bold text-[#B8D8F0] underline underline-offset-4">
                                    Block {data.latestBlockNumber} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                </a>
                            )}
                        </section>
                    </aside>
                </section>

                <div className="mt-5 -mx-5 md:-mx-8">
                    <PortfolioTable rows={data.portfolioVaults} explorerUrl={baseChain.explorerUrl} asOf={asOf} />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ quality }: { quality: 'ready' | 'collecting' | 'unavailable' }) {
    const styles = {
        ready: 'border-[#2E7455] bg-[#DDF0E6] text-[#20583F]',
        collecting: 'border-[#356C9A] bg-[#E0ECF6] text-[#234F75]',
        unavailable: 'border-[#A53B26] bg-[#F7DDD7] text-[#7A2819]',
    };
    const labels = { ready: 'Analysis ready', collecting: 'Collecting baseline', unavailable: 'Data unavailable' };
    return <span className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${styles[quality]}`}>{labels[quality]}</span>;
}

function MetricGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <section className="border border-[#C6C8C8] bg-white">
            <h2 className="border-b border-[#E0E1E1] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#626B72]">{label}</h2>
            <dl className="grid grid-cols-3 divide-x divide-[#E0E1E1]">{children}</dl>
        </section>
    );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: 'healthy' | 'collecting' | 'warning' }) {
    const dot = tone === 'healthy' ? 'bg-[#2E7455]' : tone === 'collecting' ? 'bg-[#356C9A]' : tone === 'warning' ? 'bg-[#A53B26]' : '';
    return (
        <div className="min-w-0 p-4 md:p-5">
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-[#606970]">{dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}{label}</dt>
            <dd className="mt-1.5 truncate font-mono text-xl font-bold tracking-tight tabular-nums md:text-2xl">{value}</dd>
            <dd className="mt-1 min-h-8 text-[11px] leading-4 text-[#626A72] md:min-h-0 md:text-xs">{detail}</dd>
        </div>
    );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
    return <div><dt className="text-xs text-[#68717A]">{label}</dt><dd className="mt-1 font-mono text-base font-bold tabular-nums">{value}</dd></div>;
}

function CollectionProgress({ available, observationDays, collectionDays, coverage, estimatedReadyAt, message }: { available: boolean; observationDays: number; collectionDays: number; coverage: number; estimatedReadyAt: string | null; message: string }) {
    const observationProgress = Math.min(1, observationDays / 3);
    const windowProgress = Math.min(1, collectionDays / 7);
    const progress = available ? ((observationProgress + windowProgress) / 2) * 100 : 0;
    const steps = [
        { label: 'Initial daily snapshot', complete: observationDays >= 1, detail: `${observationDays} observation ${observationDays === 1 ? 'day' : 'days'} recorded` },
        { label: 'Minimum observations', complete: observationDays >= 3, detail: `${Math.min(observationDays, 3)} of 3 required days` },
        { label: 'Measurement window', complete: collectionDays >= 7, detail: `${Math.min(collectionDays, 7).toFixed(0)} of 7 required days` },
        { label: 'Portfolio analysis', complete: observationDays >= 3 && collectionDays >= 7, detail: 'Expected and realized returns published' },
    ];

    return (
        <section aria-labelledby="collection-progress-title" className="border border-[#C6C8C8] bg-white p-5 md:p-7">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#5E6670]">Data readiness</p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 id="collection-progress-title" className="text-xl font-black tracking-tight md:text-2xl">{available ? 'Building the evidence baseline' : 'Observation data unavailable'}</h2>
                    <p className="mt-1 max-w-2xl text-sm text-[#626A72]">{message}</p>
                </div>
                {estimatedReadyAt && (
                    <div className="shrink-0 border-l-2 border-[#356C9A] pl-3">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#68717A]">Earliest eligible</div>
                        <div className="mt-1 font-semibold">{new Date(estimatedReadyAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</div>
                    </div>
                )}
            </div>

            <div className="mt-7">
                <div className="flex items-center justify-between text-xs text-[#626A72]"><span>Control completion</span><span className="font-mono font-bold">{progress.toFixed(0)}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E1E3E3]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Evidence baseline completion">
                    <div className="h-full rounded-full bg-[#356C9A] transition-[width]" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <ol className="mt-7 grid gap-3 sm:grid-cols-2">
                {steps.map((step, index) => (
                    <li key={step.label} className={`flex gap-3 border p-4 ${step.complete ? 'border-[#BBD5C7] bg-[#F0F8F3]' : 'border-[#D7D9D9] bg-[#F7F7F5]'}`}>
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold ${step.complete ? 'border-[#2E7455] bg-[#2E7455] text-white' : 'border-[#A5AAAD] text-[#68717A]'}`}>
                            {step.complete ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                        </span>
                        <div><h3 className="text-sm font-bold">{step.label}</h3><p className="mt-1 text-xs leading-relaxed text-[#68717A]">{step.detail}</p></div>
                    </li>
                ))}
            </ol>
            <div className="mt-5 flex items-center gap-2 text-xs text-[#5D666D]"><Clock3 className="h-4 w-4 text-[#356C9A]" aria-hidden="true" /> Latest valid snapshot coverage: {coverage.toFixed(0)}%</div>
        </section>
    );
}

function ProvenanceRow({ label, value }: { label: string; value: string }) {
    return <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-3"><dt className="text-[#AEB7BD]">{label}</dt><dd className="max-w-[65%] text-right font-mono text-xs font-bold uppercase">{value}</dd></div>;
}

function relativeAge(recordedAt: string | null, asOf: string) {
    if (!recordedAt) return 'Unavailable';
    const hours = Math.max(0, (Date.parse(asOf) - Date.parse(recordedAt)) / 3_600_000);
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
    if (hours < 48) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
}
