import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getDashboardData } from '@/lib/dashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Flagged Strategies | Beefy Yield-Fidelity',
    description: 'Review high-risk drift vaults.',
};

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
});

export default async function Strategies() {
    const data = await getDashboardData();

    return (
        <main className="flex flex-col w-full bg-[#D6D6D6] text-[#1E1E1E]">
            <div className="w-full flex items-center justify-between px-6 md:px-10 py-8 border-b-[1.5px] border-[#1E1E1E]">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" aria-label="Back to dashboard" className="w-12 h-12 flex items-center justify-center border-[1.5px] border-[#1E1E1E] hover:bg-[#FE5238] transition-colors group">
                        <ArrowLeft className="w-6 h-6 text-[#1E1E1E] group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Flagged Strategies</h1>
                        <p className="font-mono text-xs uppercase font-bold tracking-widest mt-1 opacity-60">Observed Base vault drift below -5%</p>
                    </div>
                </div>
                <div className="hidden md:flex px-4 py-2 bg-[#1E1E1E] text-[#D6D6D6] border-[1.5px] border-[#1E1E1E] font-mono text-xs uppercase font-bold">
                    <span className="text-[#FE5238] mr-2">{data.flaggedVaults.length}</span> At Risk
                </div>
            </div>

            {data.flaggedVaults.length > 0 ? (
                <div className="w-full bg-[#EBEBEB] overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left font-mono text-sm uppercase font-bold">
                        <thead className="bg-[#1E1E1E] text-[#D6D6D6]">
                            <tr>
                                <th className="py-4 px-6 md:px-10">Vault</th>
                                <th className="py-4 px-6">Relative Drift</th>
                                <th className="py-4 px-6">TVL</th>
                                <th className="py-4 px-6">Target APY</th>
                                <th className="py-4 px-6">Window</th>
                                <th className="py-4 px-6 md:px-10 text-right">Confidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-[1.5px] divide-[#1E1E1E]">
                            {data.flaggedVaults.map((vault) => (
                                <tr key={vault.id} className="hover:bg-[#D6D6D6] transition-colors">
                                    <td className="py-5 px-6 md:px-10 border-r border-[#1E1E1E]">{vault.name}</td>
                                    <td className="py-5 px-6 border-r border-[#1E1E1E] text-[#FE5238]">{vault.driftPercent.toFixed(1)}%</td>
                                    <td className="py-5 px-6 border-r border-[#1E1E1E]">{currency.format(vault.tvl)}</td>
                                    <td className="py-5 px-6 border-r border-[#1E1E1E]">{(vault.apy * 100).toFixed(2)}%</td>
                                    <td className="py-5 px-6 border-r border-[#1E1E1E]">{vault.measurementDays.toFixed(0)}d / {vault.observations} obs.</td>
                                    <td className="py-5 px-6 md:px-10 text-right">{vault.confidence}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="min-h-80 p-10 flex flex-col items-center justify-center text-center bg-[#EBEBEB]">
                    <h2 className="text-2xl font-black uppercase">No flagged observations</h2>
                    <p className="font-mono text-xs uppercase mt-3 max-w-xl opacity-60">{data.message}</p>
                </div>
            )}
        </main>
    );
}
