import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const FLAGGED_VAULTS = [
    { id: '1', name: 'USDC-USDT-Base', drift: '-5.2%', tvl: '$12.5M', apy: '4.1%' },
    { id: '2', name: 'cbETH-ETH', drift: '-8.4%', tvl: '$2.1M', apy: '3.8%' },
    { id: '3', name: 'DAI-USDC', drift: '-6.1%', tvl: '$8.2M', apy: '2.4%' },
    { id: '4', name: 'AERO-WETH', drift: '-12.0%', tvl: '$1.4M', apy: '18.2%' },
];

export default function Strategies() {
    return (
        <div className="flex flex-col items-center w-full space-y-8 pb-20 pt-8">

            {/* Header */}
            <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-zinc-400" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        Flagged Strategies
                    </h1>
                </div>
                <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-sm font-medium flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    12 At Risk
                </div>
            </div>

            <div className="w-full bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="pb-4 text-sm font-medium text-zinc-400">Vault Name</th>
                            <th className="pb-4 text-sm font-medium text-zinc-400">Drift severity</th>
                            <th className="pb-4 text-sm font-medium text-zinc-400">TVL</th>
                            <th className="pb-4 text-sm font-medium text-zinc-400">Target APY</th>
                            <th className="pb-4 text-sm font-medium text-zinc-400 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {FLAGGED_VAULTS.map((vault) => (
                            <tr key={vault.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 text-white font-medium">{vault.name}</td>
                                <td className="py-4">
                                    <span className="text-red-400 font-mono bg-red-400/10 px-2 py-1 rounded-md text-sm">{vault.drift}</span>
                                </td>
                                <td className="py-4 text-zinc-400">{vault.tvl}</td>
                                <td className="py-4 text-zinc-400">{vault.apy}</td>
                                <td className="py-4 text-right">
                                    <button className="text-sm border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">
                                        Delist Vault
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
