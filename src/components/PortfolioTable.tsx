'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, ExternalLink, Search } from 'lucide-react';
import type { PortfolioVault } from '@/lib/dashboard';

interface PortfolioTableProps {
    rows: PortfolioVault[];
    explorerUrl: string;
    asOf: string;
}

type SortKey = 'tvl' | 'currentApy' | 'observations' | 'driftPercent';
type StatusFilter = 'all' | PortfolioVault['status'];

const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
});

const statusLabel: Record<PortfolioVault['status'], string> = {
    review: 'Review',
    ready: 'Ready',
    collecting: 'Collecting',
    'no-data': 'No data',
};

const statusClass: Record<PortfolioVault['status'], string> = {
    review: 'border-[#A53B26] bg-[#F7DDD7] text-[#7A2819]',
    ready: 'border-[#2E7455] bg-[#DDF0E6] text-[#20583F]',
    collecting: 'border-[#356C9A] bg-[#E0ECF6] text-[#234F75]',
    'no-data': 'border-[#777] bg-[#E5E5E5] text-[#4A4A4A]',
};

function relativeAge(recordedAt: string | null, asOf: string) {
    if (!recordedAt) return 'No observation';
    const hours = Math.max(0, (Date.parse(asOf) - Date.parse(recordedAt)) / 3_600_000);
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
    if (hours < 48) return `${Math.round(hours)}h ago`;
    return `${Math.round(hours / 24)}d ago`;
}

export function PortfolioTable({ rows, explorerUrl, asOf }: PortfolioTableProps) {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<StatusFilter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('tvl');
    const [descending, setDescending] = useState(true);

    const visibleRows = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return rows
            .filter((row) => !normalizedQuery || `${row.name} ${row.id}`.toLowerCase().includes(normalizedQuery))
            .filter((row) => status === 'all' || row.status === status)
            .sort((a, b) => {
                const aValue = a[sortKey] ?? Number.NEGATIVE_INFINITY;
                const bValue = b[sortKey] ?? Number.NEGATIVE_INFINITY;
                return (Number(aValue) - Number(bValue)) * (descending ? -1 : 1);
            });
    }, [descending, query, rows, sortKey, status]);

    function changeSort(next: SortKey) {
        if (next === sortKey) setDescending((value) => !value);
        else {
            setSortKey(next);
            setDescending(true);
        }
    }

    return (
        <section aria-labelledby="portfolio-table-title" className="border-t border-[#B8B8B8] bg-[#F3F3F1]">
            <div className="flex flex-col gap-5 border-b border-[#B8B8B8] px-5 py-6 md:flex-row md:items-end md:justify-between md:px-8">
                <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#5E6670]">Portfolio detail</p>
                    <h2 id="portfolio-table-title" className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Active Base vaults</h2>
                    <p className="mt-1 text-sm text-[#5E6670]">Current portfolio context remains visible while historical analysis matures.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative block">
                        <span className="sr-only">Search vaults</span>
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6670]" aria-hidden="true" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search vaults"
                            className="h-10 w-full min-w-56 border border-[#9A9A9A] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#245B8A] sm:w-64"
                        />
                    </label>
                    <label>
                        <span className="sr-only">Filter by analysis status</span>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value as StatusFilter)}
                            className="h-10 w-full border border-[#9A9A9A] bg-white px-3 text-sm outline-none focus:border-[#245B8A] sm:w-auto"
                        >
                            <option value="all">All statuses</option>
                            <option value="review">Review</option>
                            <option value="ready">Ready</option>
                            <option value="collecting">Collecting</option>
                            <option value="no-data">No data</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="divide-y divide-[#D0D0CD] bg-white md:hidden">
                {visibleRows.map((row) => (
                    <article key={row.id} className="px-5 py-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h3 className="font-semibold leading-5 text-[#1E1E1E]">{row.name}</h3>
                                <p className="mt-1 truncate font-mono text-[10px] text-[#626A72]">{row.id}</p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${statusClass[row.status]}`}>
                                {statusLabel[row.status]}
                            </span>
                        </div>
                        <dl className="mt-4 grid grid-cols-2 border border-[#D0D0CD]">
                            <MobileDatum label="TVL" value={money.format(row.tvl)} />
                            <MobileDatum label="Current APY" value={`${(row.currentApy * 100).toFixed(2)}%`} />
                            <MobileDatum label="Observations" value={`${row.observations} / ${row.measurementDays.toFixed(0)}d`} />
                            <MobileDatum label="Drift" value={row.driftPercent === null ? '—' : `${row.driftPercent.toFixed(1)}%`} alert={row.driftPercent !== null && row.driftPercent <= -5} />
                        </dl>
                        <div className="mt-3 flex items-center justify-between gap-4 text-xs text-[#4F5860]">
                            <span>Latest PPS <span className="font-mono text-[#1E1E1E]">{row.latestPps === null ? '—' : row.latestPps.toPrecision(8)}</span></span>
                            <FreshnessLink row={row} explorerUrl={explorerUrl} asOf={asOf} />
                        </div>
                    </article>
                ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[980px] text-left text-sm">
                    <caption className="sr-only">Tracked Beefy vault portfolio with yield, PPS observations, freshness, and analysis status</caption>
                    <thead className="border-b border-[#A8A8A8] bg-[#E6E6E3] font-mono text-[11px] uppercase tracking-wide text-[#505861]">
                        <tr>
                            <th className="px-5 py-3 md:px-8">Vault</th>
                            <SortableHeader label="TVL" sort="tvl" current={sortKey} descending={descending} onSort={changeSort} />
                            <SortableHeader label="Current APY" sort="currentApy" current={sortKey} descending={descending} onSort={changeSort} />
                            <th className="px-4 py-3"><abbr title="Latest recorded price per share" className="no-underline">Latest PPS</abbr></th>
                            <SortableHeader label="Observations" sort="observations" current={sortKey} descending={descending} onSort={changeSort} />
                            <SortableHeader label="Drift" sort="driftPercent" current={sortKey} descending={descending} onSort={changeSort} />
                            <th className="px-4 py-3">Freshness</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D0D0CD] bg-white">
                        {visibleRows.map((row) => (
                            <tr key={row.id} className="transition-colors hover:bg-[#F5F8FA]">
                                <td className="px-5 py-4 md:px-8">
                                    <div className="font-semibold text-[#1E1E1E]">{row.name}</div>
                                    <div className="mt-0.5 max-w-64 truncate font-mono text-[11px] text-[#6A7178]">{row.id}</div>
                                </td>
                                <td className="px-4 py-4 font-mono tabular-nums">{money.format(row.tvl)}</td>
                                <td className="px-4 py-4 font-mono tabular-nums">{(row.currentApy * 100).toFixed(2)}%</td>
                                <td className="px-4 py-4 font-mono text-xs tabular-nums">{row.latestPps === null ? '—' : row.latestPps.toPrecision(8)}</td>
                                <td className="px-4 py-4">
                                    <span className="font-mono tabular-nums">{row.observations}</span>
                                    <span className="ml-1 text-xs text-[#6A7178]">/ {row.measurementDays.toFixed(0)}d</span>
                                </td>
                                <td className={`px-4 py-4 font-mono tabular-nums ${row.driftPercent !== null && row.driftPercent <= -5 ? 'text-[#8B2F1D]' : ''}`}>
                                    {row.driftPercent === null ? '—' : `${row.driftPercent.toFixed(1)}%`}
                                </td>
                                <td className="px-4 py-4 text-[#4F5860]"><FreshnessLink row={row} explorerUrl={explorerUrl} asOf={asOf} /></td>
                                <td className="px-4 py-4">
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${statusClass[row.status]}`}>
                                        {statusLabel[row.status]}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="border-t border-[#D0D0CD] bg-white px-5 py-3 font-mono text-[11px] text-[#626A72] md:px-8" aria-live="polite">
                Showing {visibleRows.length} of {rows.length} vaults
            </div>
        </section>
    );
}

function MobileDatum({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
    return (
        <div className="border-b border-r border-[#D0D0CD] p-3 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
            <dt className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#626A72]">{label}</dt>
            <dd className={`mt-1 font-mono text-base font-bold tabular-nums ${alert ? 'text-[#8B2F1D]' : 'text-[#1E1E1E]'}`}>{value}</dd>
        </div>
    );
}

function FreshnessLink({ row, explorerUrl, asOf }: { row: PortfolioVault; explorerUrl: string; asOf: string }) {
    if (!row.blockNumber) return <span>{relativeAge(row.latestRecordedAt, asOf)}</span>;
    return (
        <a
            href={`${explorerUrl}/block/${row.blockNumber}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline decoration-[#9BA2A8] underline-offset-2 hover:text-[#245B8A]"
            title={`View Base block ${row.blockNumber}`}
        >
            {relativeAge(row.latestRecordedAt, asOf)} <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
    );
}

function SortableHeader({
    label,
    sort,
    current,
    descending,
    onSort,
}: {
    label: string;
    sort: SortKey;
    current: SortKey;
    descending: boolean;
    onSort: (key: SortKey) => void;
}) {
    return (
        <th className="px-4 py-3">
            <button
                type="button"
                onClick={() => onSort(sort)}
                className="inline-flex items-center gap-1.5 hover:text-[#1E1E1E]"
                aria-label={`Sort by ${label}${current === sort ? `, currently ${descending ? 'descending' : 'ascending'}` : ''}`}
            >
                {label} <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
            </button>
        </th>
    );
}
