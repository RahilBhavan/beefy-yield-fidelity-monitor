import { ArrowLeft, Ban } from 'lucide-react';
import Link from 'next/link';

const FLAGGED_VAULTS = [
    { id: '1', name: 'USDC-USDT-Base', drift: '-5.2%', tvl: '$12.5M', apy: '4.1%' },
    { id: '2', name: 'cbETH-ETH', drift: '-8.4%', tvl: '$2.1M', apy: '3.8%' },
    { id: '3', name: 'DAI-USDC', drift: '-6.1%', tvl: '$8.2M', apy: '2.4%' },
    { id: '4', name: 'AERO-WETH', drift: '-12.0%', tvl: '$1.4M', apy: '18.2%' },
];

export default function Strategies() {
    return (
        <div className="flex flex-col w-full bg-[#D6D6D6] text-[#1E1E1E]">

            {/* Header */}
            <div className="w-full flex items-center justify-between px-6 md:px-10 py-8 border-b-[1.5px] border-[#1E1E1E]">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="w-12 h-12 flex items-center justify-center border-[1.5px] border-[#1E1E1E] hover:bg-[#FE5238] transition-colors group">
                        <ArrowLeft className="w-6 h-6 text-[#1E1E1E] group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                            Flagged Strategies
                        </h1>
                        <p className="font-mono text-xs uppercase font-bold tracking-widest mt-1 opacity-60">High-Risk Drift (&gt;5%) Interventions Required</p>
                    </div>
                </div>
                <div className="hidden md:flex px-4 py-2 bg-[#1E1E1E] text-[#D6D6D6] border-[1.5px] border-[#1E1E1E] font-mono text-xs uppercase font-bold">
                    <span className="text-[#FE5238] mr-2">12</span> At Risk
                </div>
            </div>

            <div className="w-full bg-[#EBEBEB]">
                <table className="w-full text-left font-mono text-sm uppercase font-bold">
                    <thead className="bg-[#1E1E1E] text-[#D6D6D6]">
                        <tr>
                            <th className="py-4 px-6 md:px-10 border-b-[1.5px] font-bold border-[#1E1E1E] w-[30%]">Vault Target</th>
                            <th className="py-4 px-6 border-b-[1.5px] font-bold border-[#1E1E1E]">Drift (%)</th>
                            <th className="py-4 px-6 border-b-[1.5px] font-bold border-[#1E1E1E]">Sys. TVL</th>
                            <th className="py-4 px-6 border-b-[1.5px] font-bold border-[#1E1E1E]">Proj. APY</th>
                            <th className="py-4 px-6 md:px-10 border-b-[1.5px] font-bold border-[#1E1E1E] text-right">Exec Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-[1.5px] divide-[#1E1E1E]">
                        {FLAGGED_VAULTS.map((vault) => (
                            <tr key={vault.id} className="hover:bg-[#D6D6D6] transition-colors group">
                                <td className="py-5 px-6 md:px-10 font-bold border-r-[1.5px] border-[#1E1E1E] group-hover:text-[#FE5238] transition-colors">{vault.name}</td>
                                <td className="py-5 px-6 border-r-[1.5px] border-[#1E1E1E]">
                                    <span className="text-[#1E1E1E] bg-[#FE5238] px-2 py-0.5 whitespace-nowrap">{vault.drift}</span>
                                </td>
                                <td className="py-5 px-6 border-r-[1.5px] border-[#1E1E1E] opacity-70">{vault.tvl}</td>
                                <td className="py-5 px-6 border-r-[1.5px] border-[#1E1E1E] opacity-70">{vault.apy}</td>
                                <td className="py-5 px-6 md:px-10 text-right">
                                    <button className="inline-flex items-center gap-2 border-[1.5px] border-[#1E1E1E] px-4 py-2 hover:bg-[#1E1E1E] hover:text-[#D6D6D6] transition-colors">
                                        <Ban className="w-3.5 h-3.5" /> Delist
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Decorative empty grid filler block */}
            <div className="h-64 border-t-[1.5px] border-[#1E1E1E] bg-[#D6D6D6] w-full flex items-center justify-center pattern-isometric pattern-[#1E1E1E] pattern-bg-white pattern-size-8 pattern-opacity-10">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-30">END OF RECORDS</span>
            </div>
        </div>
    );
}
