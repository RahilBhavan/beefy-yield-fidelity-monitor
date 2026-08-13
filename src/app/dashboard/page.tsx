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

export const revalidate = 300;

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

    const heroStat = !hasObservations
        ? { value: '—', label: 'No signal', tone: 'muted' as const }
        : !isReady
            ? { value: `${data.readyVaults}/${data.trackedVaults}`, label: 'Vaults analysis-ready', tone: 'progress' as const }
            : priorityVault
                ? { value: String(data.flaggedVaults.length), label: data.flaggedVaults.length === 1 ? 'Vault requires review' : 'Vaults require review', tone: 'critical' as const }
                : { value: String(data.readyVaults), label: 'Vaults clear of exceptions', tone: 'settled' as const };

    const heroStatColor = heroStat.tone === 'critical'
        ? 'text-[#FE5238]'
        : heroStat.tone === 'muted'
            ? 'text-[#D6D6D6]/70'
            : 'text-[#EBEBEB]';

    return (
        <div className="min-h-full bg-[#D6D6D6] text-[#1E1E1E]">
            <header className="border-b border-[#1E1E1E] bg-[#D6D6D6] px-6 py-8 md:px-10 md:py-10">
                <div className="mx-auto flex max-w-[1500px] flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <StatusChip tone={isReady ? 'settled' : isCollecting ? 'progress' : 'critical'}>
                                {isReady ? 'Analysis ready' : isCollecting ? 'Collecting baseline' : 'Data unavailable'}
                            </StatusChip>
                            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E1E1E]/70">Base · Chain 8453</span>
                        </div>
                        <h1 className="mt-4 text-4xl font-black uppercase tracking-tighter leading-[0.95] md:text-6xl">Portfolio<br className="md:hidden" /> yield monitor</h1>
                        <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-[#1E1E1E]/70 md:text-sm">
                            Reported yield, realized vault-share growth, and evidence quality in one decision surface.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/methodology" className="inline-flex h-12 min-w-[44px] items-center gap-2 rounded-full border-[1.5px] border-[#1E1E1E] px-5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#1E1E1E] hover:text-[#FE5238] transition-colors">
                            Methodology <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        {hasObservations && (
                            <a href="/api/export" className="inline-flex h-12 min-w-[44px] items-center gap-2 rounded-full border-[1.5px] border-[#1E1E1E] bg-[#1E1E1E] px-5 font-mono text-xs font-bold uppercase tracking-widest text-[#FE5238] hover:bg-transparent hover:text-[#1E1E1E] transition-colors">
                                <Download className="h-4 w-4" aria-hidden="true" /> Export data
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {/* Instrument panel: management insight + hero stat + metrics, one continuous dark region */}
            <section aria-labelledby="management-insight" className="border-b border-[#1E1E1E] bg-[#1E1E1E] text-[#D6D6D6]">
                <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[1.6fr_1fr]">
                    <div className="border-b border-[#D6D6D6]/15 p-6 md:p-10 lg:border-b-0 lg:border-r">
                        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#FE5238]">Management insight</p>
                        <h2 id="management-insight" className="mt-3 max-w-2xl text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">{decisionTitle}</h2>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#D6D6D6]/70">{decisionDetail}</p>
                        {isReady && (
                            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#D6D6D6]/15 pt-6 sm:grid-cols-4">
                                <InlineMetric label="Capital analyzed" value={compactCurrency.format(data.analyzedTvl)} />
                                <InlineMetric label="Expected APY" value={`${(data.portfolioExpectedApy * 100).toFixed(2)}%`} />
                                <InlineMetric label="Realized APY" value={`${(data.portfolioActualApy * 100).toFixed(2)}%`} />
                                <InlineMetric label="Annualized gap" value={compactCurrency.format(data.annualizedYieldGapUsd)} />
                            </dl>
                        )}
                    </div>
                    <div className="flex flex-col justify-between p-6 md:p-10">
                        <div>
                            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#D6D6D6]/70">{heroStat.label}</p>
                            <p className={`mt-3 text-7xl font-black leading-none tracking-tighter tabular-nums md:text-8xl ${heroStatColor}`}>{heroStat.value}</p>
                        </div>
                        <div className="mt-10 border-t border-[#D6D6D6]/15 pt-6">
                            <div className="flex items-center gap-2 text-[#D6D6D6]/70">
                                <Activity className="h-4 w-4" aria-hidden="true" />
                                <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">Recommended action</h3>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-[#D6D6D6]/70">
                                {!hasObservations
                                    ? 'Investigate database configuration and ingestion health before presenting performance findings.'
                                    : !isReady
                                        ? 'Continue daily collection and verify coverage. Reassess automatically when both evidence controls pass.'
                                        : priorityVault
                                            ? `Validate ${priorityVault.name}'s provenance and operating cadence before escalating the variance.`
                                            : 'Continue monitoring. The current evidence does not support intervention.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto grid max-w-[1500px] grid-cols-1 border-t border-[#D6D6D6]/15 lg:grid-cols-2">
                    <MetricGroup label="Portfolio">
                        <Metric label="Active vaults" value={data.trackedVaults.toString()} detail="Base strategies" />
                        <Metric label="Tracked TVL" value={compactCurrency.format(data.totalTvl)} detail="Current market value" />
                        <Metric label="Weighted APY" value={`${(data.weightedApy * 100).toFixed(2)}%`} detail="Current reported rate" />
                    </MetricGroup>
                    <MetricGroup label="Data quality" className="lg:border-l lg:border-[#D6D6D6]/15">
                        <Metric label="Snapshot coverage" value={`${data.latestSnapshotCoveragePercent.toFixed(0)}%`} detail={`${data.portfolioVaults.filter((vault) => vault.latestRecordedAt).length} of ${data.trackedVaults} vaults`} tone={data.latestSnapshotCoveragePercent >= 95 ? 'settled' : 'critical'} />
                        <Metric label="Analysis ready" value={`${data.analysisCoveragePercent.toFixed(0)}%`} detail={`${data.readyVaults} of ${data.trackedVaults} vaults`} tone={isReady ? 'settled' : isCollecting ? 'progress' : 'critical'} />
                        <Metric label="Freshness" value={freshnessHours === null ? '—' : relativeAge(data.updatedAt, asOf)} detail={freshnessHours !== null && freshnessHours < 36 ? 'Within 36h objective' : 'Requires attention'} tone={freshnessHours !== null && freshnessHours < 36 ? 'settled' : 'critical'} />
                    </MetricGroup>
                </div>
            </section>

            <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8 md:py-8">
                <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.75fr)]">
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
                        <section aria-labelledby="exception-review-title" className="border border-[#1E1E1E] bg-[#EBEBEB] p-5 md:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E1E1E]/70">Exception review</p>
                                    <h2 id="exception-review-title" className="mt-1 text-xl font-black tracking-tight">{isReady ? `${data.flaggedVaults.length} require review` : 'Pending evidence gate'}</h2>
                                </div>
                                <ShieldAlert className={`h-6 w-6 shrink-0 ${data.flaggedVaults.length > 0 ? 'text-[#FE5238]' : 'text-[#1E1E1E]/70'}`} aria-hidden="true" />
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-[#1E1E1E]/70">
                                {isReady
                                    ? priorityVault ? `${priorityVault.name} has the largest relative shortfall at ${priorityVault.driftPercent.toFixed(1)}%.` : 'No analyzed vault is more than 5% below its interval-matched target.'
                                    : 'Exceptions appear only after three valid observations span at least seven days.'}
                            </p>
                            {isReady ? (
                                <Link href="/dashboard/strategies" className="mt-5 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wide underline underline-offset-4 hover:text-[#FE5238]">
                                    Open exception review <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            ) : (
                                <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wide underline underline-offset-4 pointer-events-none text-[#1E1E1E]/70" aria-disabled="true">
                                    Open exception review <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                                </span>
                            )}
                        </section>

                        <section aria-labelledby="provenance-title" className="border border-[#1E1E1E] bg-[#1E1E1E] p-5 text-[#D6D6D6] md:p-6">
                            <div className="flex items-center gap-2 text-[#D6D6D6]/70">
                                <Database className="h-5 w-5" aria-hidden="true" />
                                <h2 id="provenance-title" className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">Latest provenance</h2>
                            </div>
                            <dl className="mt-5 space-y-4 text-sm">
                                <ProvenanceRow label="Recorded" value={data.updatedAt ? new Date(data.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC' : 'Unavailable'} />
                                <ProvenanceRow label="Provider" value={data.providerLabel ?? 'Unavailable'} />
                                <ProvenanceRow label="Coverage" value={`${data.latestSnapshotCoveragePercent.toFixed(0)}% valid`} />
                            </dl>
                            {data.latestBlockNumber != null && (
                                <a href={`${baseChain.explorerUrl}/block/${data.latestBlockNumber}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-mono text-xs font-bold text-[#FE5238] underline underline-offset-4">
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

type Tone = 'settled' | 'progress' | 'critical' | 'muted';

function StatusChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
    const styles: Record<Tone, string> = {
        settled: 'border-[#1E1E1E] bg-[#1E1E1E] text-[#D6D6D6]',
        progress: 'border-[#1E1E1E] border-dashed bg-transparent text-[#1E1E1E]',
        critical: 'border-[#FE5238] bg-[#FE5238] text-[#1E1E1E]',
        muted: 'border-[#1E1E1E]/30 border-dotted text-[#1E1E1E]/70',
    };
    return <span className={`inline-flex items-center border-[1.5px] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${styles[tone]}`}>{children}</span>;
}

function MetricGroup({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <section className={className}>
            <h2 className="border-b border-[#D6D6D6]/15 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#D6D6D6]/70">{label}</h2>
            <dl className="grid grid-cols-3 divide-x divide-[#D6D6D6]/15">{children}</dl>
        </section>
    );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: Tone }) {
    const dot = tone === 'settled' ? 'bg-[#EBEBEB]' : tone === 'progress' ? 'border border-[#D6D6D6]/60' : tone === 'critical' ? 'bg-[#FE5238]' : '';
    const valueColor = tone === 'critical' ? 'text-[#FE5238]' : 'text-[#EBEBEB]';
    return (
        <div className="min-w-0 p-4 md:p-5">
            <dt className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-[#D6D6D6]/70">{dot && <span className={`h-1.5 w-1.5 shrink-0 ${dot}`} />}{label}</dt>
            <dd className={`mt-1.5 truncate font-mono text-xl font-black tracking-tight tabular-nums md:text-2xl ${valueColor}`}>{value}</dd>
            <dd className="mt-1 min-h-8 text-[11px] leading-4 text-[#D6D6D6]/70 md:min-h-0">{detail}</dd>
        </div>
    );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#D6D6D6]/70">{label}</dt>
            <dd className="mt-1 font-mono text-lg font-black tabular-nums text-[#EBEBEB]">{value}</dd>
        </div>
    );
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
        <section aria-labelledby="collection-progress-title" className="border border-[#1E1E1E] bg-[#EBEBEB] p-5 md:p-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E1E1E]/70">Data readiness</p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 id="collection-progress-title" className="text-2xl font-black tracking-tight md:text-3xl">{available ? 'Building the evidence baseline' : 'Observation data unavailable'}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#1E1E1E]/70">{message}</p>
                </div>
                {estimatedReadyAt && (
                    <div className="shrink-0 border-l-[3px] border-[#FE5238] pl-3">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#1E1E1E]/70">Earliest eligible</div>
                        <div className="mt-1 font-mono text-sm font-bold">{new Date(estimatedReadyAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</div>
                    </div>
                )}
            </div>

            <div className="mt-8">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wide text-[#1E1E1E]/70"><span>Control completion</span><span className="font-bold">{progress.toFixed(0)}%</span></div>
                <div className="mt-2 h-2.5 w-full border border-[#1E1E1E] bg-[#D6D6D6]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Evidence baseline completion">
                    <div className="h-full bg-[#FE5238] transition-[width]" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <ol className="mt-8 grid gap-3 sm:grid-cols-2">
                {steps.map((step, index) => (
                    <li key={step.label} className={`flex gap-3 border p-4 ${step.complete ? 'border-[#1E1E1E] bg-[#D6D6D6]' : 'border-[#1E1E1E]/25 bg-transparent'}`}>
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center border-[1.5px] font-mono text-xs font-bold ${step.complete ? 'border-[#1E1E1E] bg-[#1E1E1E] text-[#D6D6D6]' : 'border-[#1E1E1E]/40 text-[#1E1E1E]/70'}`}>
                            {step.complete ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                        </span>
                        <div><h3 className="text-sm font-bold">{step.label}</h3><p className="mt-1 text-xs leading-relaxed text-[#1E1E1E]/70">{step.detail}</p></div>
                    </li>
                ))}
            </ol>
            <div className="mt-6 flex items-center gap-2 font-mono text-xs text-[#1E1E1E]/70"><Clock3 className="h-4 w-4 text-[#FE5238]" aria-hidden="true" /> Latest valid snapshot coverage: {coverage.toFixed(0)}%</div>
        </section>
    );
}

function ProvenanceRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-[#D6D6D6]/15 pb-3">
            <dt className="text-[#D6D6D6]/70">{label}</dt>
            <dd className="max-w-[65%] text-right font-mono text-xs font-bold uppercase">{value}</dd>
        </div>
    );
}

function relativeAge(recordedAt: string | null, asOf: string) {
    if (!recordedAt) return 'Unavailable';
    const hours = Math.max(0, (Date.parse(asOf) - Date.parse(recordedAt)) / 3_600_000);
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
    if (hours < 48) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
}
