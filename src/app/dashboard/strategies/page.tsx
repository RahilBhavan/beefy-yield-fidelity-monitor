import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldCheck, TriangleAlert } from 'lucide-react';
import { getDashboardData } from '@/lib/dashboard';
import { baseChain } from '@/lib/chains';

export const revalidate = 300;

export const metadata: Metadata = {
    title: 'Exceptions Requiring Review',
    description: 'Review Base vaults whose realized price-per-share growth is materially below target.',
};

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
});

export default async function Strategies() {
    const data = await getDashboardData();
    const isReady = data.quality === 'ready';
    const isCollecting = data.quality === 'collecting';

    return (
        <div className="min-h-full bg-[#D6D6D6] text-[#1E1E1E]">
            <header className="border-b border-[#1E1E1E] bg-[#D6D6D6] px-6 py-8 md:px-10 md:py-10">
                <div className="mx-auto flex max-w-[1500px] flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 font-mono text-xs font-bold uppercase tracking-wide hover:text-[#FE5238]">
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Portfolio dashboard
                        </Link>
                        <h1 className="mt-3 text-4xl font-black uppercase tracking-tighter leading-[0.95] md:text-6xl">Exceptions requiring review</h1>
                        <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-[#1E1E1E]/70 md:text-sm">Vaults whose realized PPS return is more than 5% below the interval-matched target.</p>
                    </div>
                    <span className={`self-start inline-flex items-center border-[1.5px] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide ${isReady ? 'border-[#FE5238] bg-[#FE5238] text-[#1E1E1E]' : isCollecting ? 'border-[#1E1E1E] border-dashed bg-transparent text-[#1E1E1E]' : 'border-[#1E1E1E]/30 border-dotted text-[#1E1E1E]/70'}`}>
                        {isReady ? `${data.flaggedVaults.length} exceptions` : isCollecting ? 'Collecting baseline' : 'Unavailable'}
                    </span>
                </div>
            </header>

            <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8 md:py-8">
                {isReady && data.flaggedVaults.length > 0 ? (
                    <section aria-labelledby="exception-table-title" className="overflow-hidden border border-[#1E1E1E] bg-[#EBEBEB]">
                        <div className="border-b border-[#1E1E1E] p-5 md:p-6">
                            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#A82A18]">Prioritized by relative variance</p>
                            <h2 id="exception-table-title" className="mt-1 text-2xl font-black tracking-tight">Performance exceptions</h2>
                            <p className="mt-1 text-sm text-[#1E1E1E]/70">Validate provenance and operating context before taking action.</p>
                        </div>

                        <div className="divide-y divide-[#1E1E1E]/15 sm:hidden">
                            {data.flaggedVaults.map((vault) => (
                                <article key={vault.id} className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-lg font-black tracking-tight">{vault.name}</h3>
                                        <span className="border-[1.5px] border-[#FE5238] bg-[#FE5238] px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-[#1E1E1E]">Review</span>
                                    </div>
                                    <dl className="mt-5 grid grid-cols-2 gap-4">
                                        <Value label="Relative drift" value={`${vault.driftPercent.toFixed(1)}%`} warning />
                                        <Value label="TVL" value={currency.format(vault.tvl)} />
                                        <Value label="Expected APY" value={`${(vault.apy * 100).toFixed(2)}%`} />
                                        <Value label="Realized APY" value={`${(vault.actualApy * 100).toFixed(2)}%`} />
                                        <Value label="Annualized gap" value={currency.format(vault.annualizedYieldGapUsd)} />
                                        <Value label="Confidence" value={vault.confidence} />
                                    </dl>
                                </article>
                            ))}
                        </div>

                        <div className="hidden overflow-x-auto sm:block">
                            <table className="w-full min-w-[980px] text-left text-sm">
                                <caption className="sr-only">Vault performance exceptions requiring review</caption>
                                <thead className="border-b border-[#1E1E1E] bg-[#1E1E1E] font-mono text-[10px] uppercase tracking-[0.12em] text-[#D6D6D6]/70">
                                    <tr>
                                        <th className="px-6 py-3 text-[#D6D6D6]">Vault</th>
                                        <th className="px-4 py-3">Relative drift</th>
                                        <th className="px-4 py-3">TVL</th>
                                        <th className="px-4 py-3">Expected APY</th>
                                        <th className="px-4 py-3">Realized APY</th>
                                        <th className="px-4 py-3">Annualized gap</th>
                                        <th className="px-4 py-3">Evidence</th>
                                        <th className="px-6 py-3 text-right">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E1E1E]/12">
                                    {data.flaggedVaults.map((vault) => (
                                        <tr key={vault.id} className="hover:bg-[#D6D6D6]">
                                            <td className="px-6 py-4 font-bold">
                                                {vault.name}
                                                {vault.blockNumber && (
                                                    <a href={`${baseChain.explorerUrl}/block/${vault.blockNumber}`} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 font-mono text-[10px] font-normal text-[#1E1E1E]/70 underline">
                                                        <span>Block {vault.blockNumber}</span><ExternalLink className="h-3 w-3" aria-hidden="true" />
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 font-mono font-bold text-[#A82A18]">{vault.driftPercent.toFixed(1)}%</td>
                                            <td className="px-4 py-4 font-mono">{currency.format(vault.tvl)}</td>
                                            <td className="px-4 py-4 font-mono">{(vault.apy * 100).toFixed(2)}%</td>
                                            <td className="px-4 py-4 font-mono">{(vault.actualApy * 100).toFixed(2)}%</td>
                                            <td className="px-4 py-4 font-mono">{currency.format(vault.annualizedYieldGapUsd)}</td>
                                            <td className="px-4 py-4 font-mono text-xs">{vault.observations} obs · {vault.measurementDays.toFixed(0)}d</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs uppercase">{vault.confidence}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : (
                    <section className="mx-auto max-w-3xl border border-[#1E1E1E] bg-[#EBEBEB] p-8 text-center md:p-12">
                        {isReady ? <ShieldCheck className="mx-auto h-9 w-9 text-[#1E1E1E]" aria-hidden="true" /> : <TriangleAlert className="mx-auto h-9 w-9 text-[#FE5238]" aria-hidden="true" />}
                        <h2 className="mt-4 text-2xl font-black tracking-tight">{isReady ? 'No exceptions require review' : isCollecting ? 'Exception analysis is still maturing' : 'Strategy data is unavailable'}</h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#1E1E1E]/70">{data.message}</p>
                        <Link href="/dashboard" className="mt-6 inline-flex h-11 min-w-[44px] items-center rounded-full border-[1.5px] border-[#1E1E1E] bg-[#1E1E1E] px-5 font-mono text-xs font-bold uppercase tracking-widest text-[#FE5238] hover:bg-transparent hover:text-[#1E1E1E] transition-colors">Return to portfolio dashboard</Link>
                    </section>
                )}
            </div>
        </div>
    );
}

function Value({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
    return (
        <div>
            <dt className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#1E1E1E]/70">{label}</dt>
            <dd className={`mt-1 font-mono font-bold ${warning ? 'text-[#A82A18]' : ''}`}>{value}</dd>
        </div>
    );
}
