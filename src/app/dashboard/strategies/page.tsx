import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
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
    const qualityLabel = isReady
        ? `${data.flaggedVaults.length} at risk`
        : isCollecting
            ? 'Collecting data'
            : 'Unavailable';

    return (
        <div className="flex flex-col w-full bg-[#D6D6D6] text-[#1E1E1E]">
            <header className="w-full flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between px-6 md:px-10 py-8 border-b-[1.5px] border-[#1E1E1E]">
                <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                    <Link href="/dashboard" aria-label="Back to dashboard" className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center border-[1.5px] border-[#1E1E1E] hover:bg-[#FE5238] transition-colors group">
                        <ArrowLeft className="w-6 h-6 text-[#1E1E1E] group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Exceptions Requiring Review</h1>
                        <p className="font-mono text-xs uppercase font-bold tracking-widest mt-2 text-[#1E1E1E]/75">
                            {isReady ? 'Observed Base vault drift below -5%' : 'Base vault drift analysis status'}
                        </p>
                    </div>
                </div>
                <div className="self-start sm:self-auto px-4 py-2 bg-[#1E1E1E] text-[#D6D6D6] border-[1.5px] border-[#1E1E1E] font-mono text-xs uppercase font-bold">
                    {qualityLabel}
                </div>
            </header>

            {isReady && data.flaggedVaults.length > 0 ? (
                <div className="w-full bg-[#EBEBEB]">
                    <div className="sm:hidden divide-y-[1.5px] divide-[#1E1E1E]">
                        {data.flaggedVaults.map((vault) => (
                            <article key={vault.id} className="p-6">
                                <h2 className="text-xl font-black uppercase tracking-tight">{vault.name}</h2>
                                <dl className="grid grid-cols-2 gap-x-5 gap-y-4 mt-5 font-mono text-xs uppercase">
                                    <div>
                                        <dt className="text-[#1E1E1E]/75">Relative drift</dt>
                                        <dd className="mt-1 font-bold text-[#8F2415]">{vault.driftPercent.toFixed(1)}%</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[#1E1E1E]/75">TVL</dt>
                                        <dd className="mt-1 font-bold">{currency.format(vault.tvl)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[#1E1E1E]/75">Target APY</dt>
                                        <dd className="mt-1 font-bold">{(vault.apy * 100).toFixed(2)}%</dd>
                                    </div>
                                    <div>
                                        <dt className="opacity-60">Realized APY</dt>
                                        <dd className="mt-1 font-bold">{(vault.actualApy * 100).toFixed(2)}%</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[#1E1E1E]/75">Confidence</dt>
                                        <dd className="mt-1 font-bold">{vault.confidence}</dd>
                                    </div>
                                    <div>
                                        <dt className="opacity-60">Annualized gap</dt>
                                        <dd className="mt-1 font-bold">{currency.format(vault.annualizedYieldGapUsd)}</dd>
                                    </div>
                                    <div className="col-span-2">
                                        <dt className="text-[#1E1E1E]/75">Measurement window</dt>
                                        <dd className="mt-1 font-bold">{vault.measurementDays.toFixed(0)}d / {vault.observations} obs.</dd>
                                    </div>
                                </dl>
                                {vault.blockNumber && (
                                    <a
                                        href={`${baseChain.explorerUrl}/block/${vault.blockNumber}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block mt-5 font-mono text-xs font-bold uppercase underline hover:text-[#8F2415]"
                                    >
                                        View block {vault.blockNumber} on BaseScan
                                    </a>
                                )}
                            </article>
                        ))}
                    </div>
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left font-mono text-sm uppercase font-bold">
                            <thead className="bg-[#1E1E1E] text-[#D6D6D6]">
                                <tr>
                                    <th className="py-4 px-6 md:px-10">Vault</th>
                                    <th className="py-4 px-6">Relative Drift</th>
                                    <th className="py-4 px-6">TVL</th>
                                <th className="py-4 px-6">Target APY</th>
                                <th className="py-4 px-6">Realized APY</th>
                                <th className="py-4 px-6">Annualized Gap</th>
                                    <th className="py-4 px-6">Window</th>
                                    <th className="py-4 px-6 md:px-10 text-right">Confidence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-[1.5px] divide-[#1E1E1E]">
                                {data.flaggedVaults.map((vault) => (
                                    <tr key={vault.id} className="hover:bg-[#D6D6D6] transition-colors">
                                        <td className="py-5 px-6 md:px-10 border-r border-[#1E1E1E]">
                                            {vault.name}
                                            {vault.blockNumber && (
                                                <a
                                                    href={`${baseChain.explorerUrl}/block/${vault.blockNumber}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block mt-1 text-xs underline text-[#1E1E1E]/75 hover:text-[#8F2415]"
                                                >
                                                    Block {vault.blockNumber}
                                                </a>
                                            )}
                                        </td>
                                        <td className="py-5 px-6 border-r border-[#1E1E1E] text-[#8F2415]">{vault.driftPercent.toFixed(1)}%</td>
                                        <td className="py-5 px-6 border-r border-[#1E1E1E]">{currency.format(vault.tvl)}</td>
                                    <td className="py-5 px-6 border-r border-[#1E1E1E]">{(vault.apy * 100).toFixed(2)}%</td>
                                    <td className="py-5 px-6 border-r border-[#1E1E1E]">{(vault.actualApy * 100).toFixed(2)}%</td>
                                    <td className="py-5 px-6 border-r border-[#1E1E1E]">{currency.format(vault.annualizedYieldGapUsd)}</td>
                                        <td className="py-5 px-6 border-r border-[#1E1E1E]">{vault.measurementDays.toFixed(0)}d / {vault.observations} obs.</td>
                                        <td className="py-5 px-6 md:px-10 text-right">{vault.confidence}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="min-h-80 p-10 flex flex-col items-center justify-center text-center bg-[#EBEBEB]">
                    <h2 className="text-2xl font-black uppercase">
                        {isReady ? 'No exceptions require review' : isCollecting ? 'Analysis in progress' : 'Strategy data unavailable'}
                    </h2>
                    <p className="font-mono text-xs uppercase mt-3 max-w-xl text-[#1E1E1E]/75">{data.message}</p>
                </div>
            )}
        </div>
    );
}
