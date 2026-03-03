"use client";

import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

const MOCK_DATA = [
    { day: 'Day 1', target: 12.0, actual: 12.0 },
    { day: 'Day 5', target: 12.0, actual: 11.8 },
    { day: 'Day 10', target: 12.0, actual: 11.2 },
    { day: 'Day 15', target: 12.0, actual: 10.5 },
    { day: 'Day 20', target: 12.0, actual: 10.1 },
    { day: 'Day 25', target: 12.0, actual: 9.4 },
    { day: 'Day 30', target: 12.0, actual: 8.8 },
];

export function DriftChart() {
    const currentTarget = MOCK_DATA[MOCK_DATA.length - 1].target;
    const currentActual = MOCK_DATA[MOCK_DATA.length - 1].actual;
    const driftPerc = ((currentTarget - currentActual) / currentTarget) * 100;

    return (
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 w-full flex flex-col">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-indigo-400" />
                        Strategy Drift Analysis
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">30x-Day Trajectory: Target APY vs. Actual Price-Per-Share Growth.</p>
                </div>

                <div className="text-right">
                    <div className="text-sm text-zinc-400">Current Drift</div>
                    <div className="text-2xl font-bold text-red-400 flex items-center gap-1 justify-end">
                        {driftPerc.toFixed(1)}% <AlertTriangle className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="relative flex-1 min-h-[300px] w-full mt-4 flex items-end justify-between gap-2 border-b border-zinc-800 pb-2">
                {/* Y-Axis scale markers */}
                <div className="absolute left-0 top-0 bottom-0 w-full flex flex-col justify-between text-[10px] text-zinc-600 font-mono pointer-events-none z-0">
                    <div className="border-b border-zinc-800/50 w-full pb-1">15%</div>
                    <div className="border-b border-zinc-800/50 w-full pb-1">10%</div>
                    <div className="border-b border-zinc-800/50 w-full pb-1">5%</div>
                    <div>0%</div>
                </div>

                {MOCK_DATA.map((point, i) => (
                    <div key={point.day} className="relative z-10 flex flex-col items-center justify-end h-full w-full group">
                        {/* Tooltip on Hover */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 text-xs p-2 rounded-lg whitespace-nowrap z-20 pointer-events-none">
                            <span className="text-zinc-400">Target:</span> <span className="text-green-400">{point.target}%</span><br />
                            <span className="text-zinc-400">Actual:</span> <span className="text-indigo-400">{point.actual}%</span>
                        </div>

                        {/* Target Bar (Background) */}
                        <div className="relative w-full max-w-[40px] h-[300px] flex items-end">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(point.target / 15) * 100}%` }}
                                transition={{ duration: 1, delay: i * 0.05 }}
                                className="absolute bottom-0 w-full bg-green-500/10 border border-green-500/20 rounded-t-md"
                            ></motion.div>

                            {/* Actual Yield Bar (Foreground overlaps) */}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(point.actual / 15) * 100}%` }}
                                transition={{ duration: 1, delay: 0.5 + (i * 0.05), type: 'spring' }}
                                className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-900 to-indigo-500 rounded-t-md shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                            ></motion.div>
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-3 absolute -bottom-6">{point.day}</span>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center gap-6 mt-10">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <div className="w-3 h-3 rounded-sm bg-green-500/20 border border-green-500/50"></div>
                    Projected Yield (Platform)
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
                    Net Realized Growth (PPS)
                </div>
            </div>
        </div>
    );
}
