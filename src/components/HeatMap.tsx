"use client";

import { Activity, Disc, Target } from 'lucide-react';

const MOCK_CHAINS = [
    { name: 'Base', friction: 'Minimal', score: 92, gas: '$0.02', apy: '12.4%', color: 'bg-green-500' },
    { name: 'Arbitrum', friction: 'Low', score: 85, gas: '$0.08', apy: '9.2%', color: 'bg-emerald-500' },
    { name: 'Optimism', friction: 'Medium', score: 68, gas: '$0.15', apy: '7.1%', color: 'bg-amber-500' },
    { name: 'Ethereum', friction: 'Heavy', score: 24, gas: '$15.40', apy: '4.5%', color: 'bg-[#FE5238]' },
];

export function HeatMap() {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between px-6 md:px-10 py-6 border-b-[1.5px] border-[#1E1E1E] bg-[#D6D6D6]">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-[#1E1E1E] flex items-center gap-2">
                        <Target className="w-6 h-6 text-[#FE5238]" />
                        Network Friction Map
                    </h2>
                    <p className="font-mono text-[10px] uppercase font-bold text-[#1E1E1E]/60 mt-1">Cross-chain execution costs relative to yield.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-[#EBEBEB] border-[1.5px] border-[#1E1E1E] px-4 py-2 font-mono text-xs font-bold uppercase text-[#1E1E1E]">
                    <Activity className="w-3.5 h-3.5 text-[#FE5238]" /> Sensor Live
                </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#1E1E1E]">
                {MOCK_CHAINS.map((chain, index) => (
                    <li
                        key={chain.name}
                        className={`p-6 border-b-[1.5px] sm:border-b-0 border-[#D6D6D6]/30 ${index !== MOCK_CHAINS.length - 1 && 'sm:border-r-[1.5px]'} group hover:bg-[#D6D6D6]/5 transition-colors`}
                    >

                        <div className="flex items-center justify-between mb-8">
                            <span className="font-black text-xl uppercase text-[#D6D6D6]">{chain.name}</span>
                            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#1E1E1E] px-2 py-0.5 bg-[#D6D6D6]">
                                {chain.friction}
                            </span>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-5xl font-black tracking-tighter text-[#D6D6D6]">{chain.score}</span>
                                <span className="font-mono text-xs text-[#D6D6D6]/50">/100</span>
                            </div>
                            {/* Brutalist Progress Bar */}
                            <div className="w-full h-4 border-[1.5px] border-[#D6D6D6]/30 p-[2px]">
                                <div className={`h-full ${chain.color}`} style={{ width: `${chain.score}%` }}></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t-[1.5px] border-[#D6D6D6]/30 pt-4 text-[#D6D6D6]">
                            <div>
                                <div className="font-mono text-[10px] uppercase font-bold opacity-60">Avg. Gas</div>
                                <div className="font-mono text-lg font-bold mt-1 group-hover:text-[#FE5238] transition-colors">{chain.gas}</div>
                            </div>
                            <div>
                                <div className="font-mono text-[10px] uppercase font-bold opacity-60 flex items-center gap-1">
                                    Avg. APY
                                    <Disc className="w-2 h-2 text-[#FE5238] fill-[#FE5238] animate-pulse" />
                                </div>
                                <div className="font-mono text-lg font-bold mt-1 group-hover:text-green-500 transition-colors">{chain.apy}</div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
