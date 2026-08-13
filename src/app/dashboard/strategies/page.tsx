import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldCheck, TriangleAlert } from 'lucide-react';
import { getDashboardData } from '@/lib/dashboard';
import { baseChain } from '@/lib/chains';

export const dynamic = 'force-dynamic';

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
        <div className="min-h-full bg-[#ECEDEB] text-[#202326]">
            <header className="border-b border-[#BFC2C1] bg-[#F7F7F5] px-5 py-5 md:px-8 md:py-6">
                <div className="mx-auto flex max-w-[1500px] flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#53606A] hover:text-[#245B8A]">
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Portfolio dashboard
                        </Link>
                        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-5xl">Exceptions requiring review</h1>
                        <p className="mt-2 text-sm text-[#606970] md:text-base">Vaults whose realized PPS return is more than 5% below the interval-matched target.</p>
                    </div>
                    <span className={`self-start rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide ${isReady ? 'border-[#A53B26] bg-[#F7DDD7] text-[#7A2819]' : isCollecting ? 'border-[#356C9A] bg-[#E0ECF6] text-[#234F75]' : 'border-[#777] bg-[#E5E5E5] text-[#4A4A4A]'}`}>
                        {isReady ? `${data.flaggedVaults.length} exceptions` : isCollecting ? 'Collecting baseline' : 'Unavailable'}
                    </span>
                </div>
            </header>

            <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8 md:py-8">
                {isReady && data.flaggedVaults.length > 0 ? (
                    <section aria-labelledby="exception-table-title" className="overflow-hidden border border-[#C6C8C8] bg-white">
                        <div className="border-b border-[#D5D7D7] p-5 md:p-6">
                            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2819]">Prioritized by relative variance</p>
                            <h2 id="exception-table-title" className="mt-1 text-2xl font-black">Performance exceptions</h2>
                            <p className="mt-1 text-sm text-[#626A72]">Validate provenance and operating context before taking action.</p>
                        </div>

                        <div className="grid gap-px bg-[#D5D7D7] sm:hidden">
                            {data.flaggedVaults.map((vault) => (
                                <article key={vault.id} className="bg-white p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-lg font-black">{vault.name}</h3>
                                        <span className="rounded-full border border-[#A53B26] bg-[#F7DDD7] px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-[#7A2819]">Review</span>
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
                                <thead className="border-b border-[#A8A8A8] bg-[#E6E6E3] font-mono text-[11px] uppercase tracking-wide text-[#505861]">
                                    <tr><th className="px-6 py-3">Vault</th><th className="px-4 py-3">Relative drift</th><th className="px-4 py-3">TVL</th><th className="px-4 py-3">Expected APY</th><th className="px-4 py-3">Realized APY</th><th className="px-4 py-3">Annualized gap</th><th className="px-4 py-3">Evidence</th><th className="px-6 py-3 text-right">Confidence</th></tr>
                                </thead>
                                <tbody className="divide-y divide-[#D0D0CD]">
                                    {data.flaggedVaults.map((vault) => (
                                        <tr key={vault.id} className="hover:bg-[#F5F8FA]">
                                            <td className="px-6 py-4 font-semibold">{vault.name}{vault.blockNumber && <a href={`${baseChain.explorerUrl}/block/${vault.blockNumber}`} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 font-mono text-[10px] font-normal text-[#5E6670] underline"><span>Block {vault.blockNumber}</span><ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}</td>
                                            <td className="px-4 py-4 font-mono font-bold text-[#8B2F1D]">{vault.driftPercent.toFixed(1)}%</td>
                                            <td className="px-4 py-4 font-mono">{currency.format(vault.tvl)}</td>
                                            <td className="px-4 py-4 font-mono">{(vault.apy * 100).toFixed(2)}%</td>
                                            <td className="px-4 py-4 font-mono">{(vault.actualApy * 100).toFixed(2)}%</td>
                                            <td className="px-4 py-4 font-mono">{currency.format(vault.annualizedYieldGapUsd)}</td>
                                            <td className="px-4 py-4 font-mono text-xs">{vault.observations} obs · {vault.measurementDays.toFixed(0)}d</td>
                                            <td className="px-6 py-4 text-right capitalize">{vault.confidence}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : (
                    <section className="mx-auto max-w-3xl border border-[#C6C8C8] bg-white p-8 text-center md:p-12">
                        {isReady ? <ShieldCheck className="mx-auto h-9 w-9 text-[#2E7455]" aria-hidden="true" /> : <TriangleAlert className="mx-auto h-9 w-9 text-[#356C9A]" aria-hidden="true" />}
                        <h2 className="mt-4 text-2xl font-black">{isReady ? 'No exceptions require review' : isCollecting ? 'Exception analysis is still maturing' : 'Strategy data is unavailable'}</h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#626A72]">{data.message}</p>
                        <Link href="/dashboard" className="mt-6 inline-flex h-10 items-center bg-[#202326] px-4 text-sm font-semibold text-white">Return to portfolio dashboard</Link>
                    </section>
                )}
            </div>
        </div>
    );
}

function Value({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
    return <div><dt className="text-xs text-[#68717A]">{label}</dt><dd className={`mt-1 font-mono font-bold ${warning ? 'text-[#8B2F1D]' : ''}`}>{value}</dd></div>;
}
