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
    review: 'border-[#FE5238] bg-[#FE5238] text-[#1E1E1E]',
    ready: 'border-[#1E1E1E] bg-[#1E1E1E] text-[#D6D6D6]',
    collecting: 'border-[#1E1E1E] border-dashed bg-transparent text-[#1E1E1E]',
    'no-data': 'border-[#1E1E1E]/30 border-dotted text-[#1E1E1E]/70',
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
        <section aria-labelledby="portfolio-table-title" className="border-t border-[#1E1E1E] bg-[#D6D6D6]">
            <div className="flex flex-col gap-5 border-b border-[#1E1E1E] px-5 py-6 md:flex-row md:items-end md:justify-between md:px-8">
                <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E1E1E]/70">Portfolio detail</p>
                    <h2 id="portfolio-table-title" className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Active Base vaults</h2>
                    <p className="mt-1 text-sm text-[#1E1E1E]/70">Current portfolio context remains visible while historical analysis matures.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative block">
                        <span className="sr-only">Search vaults</span>
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1E1E1E]/70" aria-hidden="true" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search vaults"
                            className="h-11 w-full min-w-56 border-[1.5px] border-[#1E1E1E] bg-[#EBEBEB] pl-9 pr-3 font-mono text-sm outline-none focus:border-[#FE5238] sm:w-64"
                        />
                    </label>
                    <label>
                        <span className="sr-only">Filter by analysis status</span>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value as StatusFilter)}
                            className="h-11 w-full border-[1.5px] border-[#1E1E1E] bg-[#EBEBEB] px-3 font-mono text-sm outline-none focus:border-[#FE5238] sm:w-auto"
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

            <div className="divide-y divide-[#1E1E1E]/15 bg-[#EBEBEB] md:hidden">
                {visibleRows.map((row) => (
                    <article key={row.id} className="px-5 py-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h3 className="font-bold leading-5 text-[#1E1E1E]">{row.name}</h3>
                                <p className="mt-1 truncate font-mono text-[10px] text-[#1E1E1E]/70">{row.id}</p>
                            </div>
                            <span className={`shrink-0 border-[1.5px] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${statusClass[row.status]}`}>
                                {statusLabel[row.status]}
                            </span>
                        </div>
                        <dl className="mt-4 grid grid-cols-2 border border-[#1E1E1E]/20">
                            <MobileDatum label="TVL" value={money.format(row.tvl)} />
                            <MobileDatum label="Current APY" value={`${(row.currentApy * 100).toFixed(2)}%`} />
                            <MobileDatum label="Observations" value={`${row.observations} / ${row.measurementDays.toFixed(0)}d`} />
                            <MobileDatum label="Drift" value={row.driftPercent === null ? '—' : `${row.driftPercent.toFixed(1)}%`} alert={row.driftPercent !== null && row.driftPercent <= -5} />
                        </dl>
                        <div className="mt-3 flex items-center justify-between gap-4 font-mono text-xs text-[#1E1E1E]/70">
                            <span>PPS <span className="text-[#1E1E1E]">{row.latestPps === null ? '—' : row.latestPps.toPrecision(8)}</span></span>
                            <FreshnessLink row={row} explorerUrl={explorerUrl} asOf={asOf} />
                        </div>
                    </article>
                ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[980px] text-left text-sm">
                    <caption className="sr-only">Tracked Beefy vault portfolio with yield, PPS observations, freshness, and analysis status</caption>
                    <thead className="border-b border-[#1E1E1E] bg-[#1E1E1E] font-mono text-[10px] uppercase tracking-[0.12em] text-[#D6D6D6]/70">
                        <tr>
                            <th className="px-5 py-3 md:px-8 text-[#D6D6D6]">Vault</th>
                            <SortableHeader label="TVL" sort="tvl" current={sortKey} descending={descending} onSort={changeSort} />
                            <SortableHeader label="Current APY" sort="currentApy" current={sortKey} descending={descending} onSort={changeSort} />
                            <th className="px-4 py-3"><abbr title="Latest recorded price per share" className="no-underline">Latest PPS</abbr></th>
                            <SortableHeader label="Observations" sort="observations" current={sortKey} descending={descending} onSort={changeSort} />
                            <SortableHeader label="Drift" sort="driftPercent" current={sortKey} descending={descending} onSort={changeSort} />
                            <th className="px-4 py-3">Freshness</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E1E1E]/12 bg-[#EBEBEB]">
                        {visibleRows.map((row) => (
                            <tr key={row.id} className="transition-colors hover:bg-[#D6D6D6]">
                                <td className="px-5 py-4 md:px-8">
                                    <div className="font-bold text-[#1E1E1E]">{row.name}</div>
                                    <div className="mt-0.5 max-w-64 truncate font-mono text-[11px] text-[#1E1E1E]/70">{row.id}</div>
                                </td>
                                <td className="px-4 py-4 font-mono tabular-nums">{money.format(row.tvl)}</td>
                                <td className="px-4 py-4 font-mono tabular-nums">{(row.currentApy * 100).toFixed(2)}%</td>
                                <td className="px-4 py-4 font-mono text-xs tabular-nums">{row.latestPps === null ? '—' : row.latestPps.toPrecision(8)}</td>
                                <td className="px-4 py-4">
                                    <span className="font-mono tabular-nums">{row.observations}</span>
                                    <span className="ml-1 text-xs text-[#1E1E1E]/70">/ {row.measurementDays.toFixed(0)}d</span>
                                </td>
                                <td className={`px-4 py-4 font-mono tabular-nums ${row.driftPercent !== null && row.driftPercent <= -5 ? 'font-bold text-[#A82A18]' : ''}`}>
                                    {row.driftPercent === null ? '—' : `${row.driftPercent.toFixed(1)}%`}
                                </td>
                                <td className="px-4 py-4 text-[#1E1E1E]/70"><FreshnessLink row={row} explorerUrl={explorerUrl} asOf={asOf} /></td>
                                <td className="px-4 py-4">
                                    <span className={`inline-flex border-[1.5px] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${statusClass[row.status]}`}>
                                        {statusLabel[row.status]}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="border-t border-[#1E1E1E]/20 bg-[#EBEBEB] px-5 py-3 font-mono text-[11px] text-[#1E1E1E]/70 md:px-8" aria-live="polite">
                Showing {visibleRows.length} of {rows.length} vaults
            </div>
        </section>
    );
}

function MobileDatum({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
    return (
        <div className="border-b border-r border-[#1E1E1E]/20 p-3 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
            <dt className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#1E1E1E]/70">{label}</dt>
            <dd className={`mt-1 font-mono text-base font-bold tabular-nums ${alert ? 'text-[#A82A18]' : 'text-[#1E1E1E]'}`}>{value}</dd>
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
            className="-my-3.5 inline-flex min-h-11 items-center gap-1 underline decoration-[#1E1E1E]/40 underline-offset-2 hover:text-[#FE5238]"
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
                className="inline-flex min-h-11 items-center gap-1.5 text-[#D6D6D6]/70 hover:text-[#FE5238]"
                aria-label={`Sort by ${label}${current === sort ? `, currently ${descending ? 'descending' : 'ascending'}` : ''}`}
            >
                {label} <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
            </button>
        </th>
    );
}
