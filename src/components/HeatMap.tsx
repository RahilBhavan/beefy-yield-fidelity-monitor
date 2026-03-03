"use client";

import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, Flame, Layers } from 'lucide-react';

const MOCK_CHAINS = [
    { name: 'Base', friction: 'Very Low', score: 92, gas: '$0.02', apy: '12.4%', color: 'bg-green-500' },
    { name: 'Arbitrum', friction: 'Low', score: 85, gas: '$0.08', apy: '9.2%', color: 'bg-emerald-500' },
    { name: 'Optimism', friction: 'Medium', score: 68, gas: '$0.15', apy: '7.1%', color: 'bg-amber-500' },
    { name: 'Ethereum', friction: 'High', score: 24, gas: '$15.40', apy: '4.5%', color: 'bg-red-500' },
];

export function HeatMap() {
    return (
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Network Friction Heat Map
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">Real-time analysis of Gas vs. APY ratios across chains.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-black/50 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-zinc-400">
                    <Activity className="w-3.5 h-3.5 text-green-400" /> Live Data
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {MOCK_CHAINS.map((chain, i) => (
                    <motion.div
                        key={chain.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`relative overflow-hidden rounded-2xl border border-white/5 bg-black p-5 group transition-all duration-300 hover:border-${chain.color.split('-')[1]}-500/30`}
                    >
                        {/* Background Glow on Hover */}
                        <div className={`absolute -top-10 -right-10 w-32 h-32 ${chain.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 rounded-full`}></div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                                <span className="font-semibold text-white">{chain.name}</span>
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${chain.color}/10 text-${chain.color.split('-')[1]}-400 border border-${chain.color.split('-')[1]}-500/20`}>
                                {chain.friction}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="text-xs text-zinc-500 mb-1">Efficiency Score</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-white">{chain.score}</span>
                                    <span className="text-sm text-zinc-500">/100</span>
                                </div>
                            </div>

                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${chain.score}%` }}
                                    transition={{ delay: 0.5 + (i * 0.1), duration: 1, ease: 'easeOut' }}
                                    className={`h-full ${chain.color}`}
                                ></motion.div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase">Avg Gas</div>
                                    <div className="font-mono text-sm text-zinc-300">{chain.gas}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase">Avg Yield</div>
                                    <div className="font-mono text-sm text-zinc-300 flex items-center gap-0.5">
                                        {chain.apy} <ArrowUpRight className="w-3 h-3 text-green-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
