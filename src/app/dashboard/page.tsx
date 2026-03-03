"use client";

import { HeatMap } from '@/components/HeatMap';
import { DriftChart } from '@/components/DriftChart';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="flex flex-col items-center w-full space-y-12 pb-20">

            {/* Dashboard Header */}
            <section className="w-full text-left pt-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
                    DAO Analytics View
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                    Yield Fidelity <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">Command Center.</span>
                </h1>
                <p className="text-lg text-zinc-400 max-w-3xl">
                    Internal metrics tracking Strategy Drift and cross-chain Friction limits to ensure users aren't trapped in negative-yield positions.
                </p>
            </section>

            {/* Primary Analytics Grid */}
            <section className="w-full grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Drift Chart takes up 2 columns on large screens */}
                <div className="xl:col-span-2">
                    <DriftChart />
                </div>

                {/* Quick Stats Sidebar */}
                <div className="flex flex-col gap-6">
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                        <ShieldAlert className="w-6 h-6 text-red-400 mb-4" />
                        <div className="text-3xl font-bold text-white mb-1">12</div>
                        <div className="text-sm text-zinc-400">Vaults flagged for severe Price-Per-Share Drift (&gt;5%)</div>
                        <a href="/dashboard/strategies" className="text-xs text-red-400 font-medium mt-4 flex items-center gap-1 hover:text-red-300">
                            Review Strategies <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden flex-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                        <h3 className="text-white font-semibold mb-4">Top Performing Chains</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    <span className="text-sm text-zinc-300">Base</span>
                                </div>
                                <span className="text-sm font-mono text-green-400">92/100</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-sm text-zinc-300">Arbitrum</span>
                                </div>
                                <span className="text-sm font-mono text-emerald-400">85/100</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span className="text-sm text-zinc-300">Optimism</span>
                                </div>
                                <span className="text-sm font-mono text-amber-400">68/100</span>
                            </div>
                        </div>
                    </div>
                </div>

            </section>

            {/* Heat Map Section */}
            <section className="w-full pt-8">
                <HeatMap />
            </section>

        </div>
    );
}
