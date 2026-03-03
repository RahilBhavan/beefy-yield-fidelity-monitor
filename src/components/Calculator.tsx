"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings, RefreshCw, AlertCircle, Info, Zap } from 'lucide-react';

interface Vault {
    id: string;
    name: string;
    chain: string;
    tvl: number;
    apy: number;
}

interface GasData {
    priceGwei: string;
    estimatedCostUsd: number;
    ethPrice: number;
}

export function Calculator() {
    const [deposit, setDeposit] = useState<string>('1000');
    const [selectedVaultId, setSelectedVaultId] = useState<string>('');

    const [vaults, setVaults] = useState<Vault[]>([]);
    const [gasData, setGasData] = useState<GasData | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/data');
                const data = await res.json();
                if (data.vaults) {
                    setVaults(data.vaults);
                    if (data.vaults.length > 0) {
                        setSelectedVaultId(data.vaults[0].id);
                    }
                }
                if (data.gas) {
                    setGasData(data.gas);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const selectedVault = useMemo(() => vaults.find(v => v.id === selectedVaultId) || null, [vaults, selectedVaultId]);

    const rawDeposit = parseFloat(deposit) || 0;

    const calculations = useMemo(() => {
        if (!selectedVault || !gasData || rawDeposit <= 0) return null;

        // Beefy totalApy is a decimal. e.g. 0.05 = 5%
        const yearlyYield = rawDeposit * selectedVault.apy;
        const dailyYield = yearlyYield / 365;

        // Gas Exit and Entry are roughly half the total tx cost each
        const totalGasCost = gasData.estimatedCostUsd;
        const gasEntry = totalGasCost / 2;
        const gasExit = totalGasCost / 2;

        const breakEvenDays = dailyYield > 0 ? totalGasCost / dailyYield : Infinity;

        // Calculate exact date of break-even
        const breakEvenDate = new Date();
        breakEvenDate.setDate(breakEvenDate.getDate() + Math.ceil(breakEvenDays));

        return {
            dailyYield,
            gasEntry,
            gasExit,
            totalGasCost,
            breakEvenDays: Math.ceil(breakEvenDays),
            breakEvenDate: breakEvenDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            willNeverBreakEven: breakEvenDays === Infinity || isNaN(breakEvenDays)
        };
    }, [selectedVault, gasData, rawDeposit]);

    const handleCalculate = () => {
        setIsCalculating(true);
        setTimeout(() => setIsCalculating(false), 500);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    const formatPercentage = (val: number) => (val * 100).toFixed(2) + '%';
    const formatTvl = (val: number) => {
        if (val > 1e6) return `$${(val / 1e6).toFixed(1)}M`;
        if (val > 1e3) return `$${(val / 1e3).toFixed(1)}K`;
        return `$${val.toFixed(0)}`;
    };

    if (isLoading) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-8 h-[600px] flex flex-col"
            >
                <div className="space-y-4">
                    <label className="text-zinc-400 font-medium text-sm flex items-center justify-between">
                        <span>Intended Deposit ($)</span>
                        <span className="text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-400/10 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            Base L2
                        </span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xl">$</span>
                        <input
                            type="number"
                            value={deposit}
                            onChange={(e) => setDeposit(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 rounded-xl py-4 pl-10 pr-4 text-white text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-mono"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between">
                        <label className="text-zinc-400 font-medium text-sm">Select Vault Strategy</label>
                        <span className="text-xs text-zinc-500">{vaults.length} vaults loaded</span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {vaults.slice(0, 10).map((vault) => (
                            <button
                                key={vault.id}
                                onClick={() => setSelectedVaultId(vault.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedVaultId === vault.id
                                        ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                        : 'bg-black/50 border-zinc-800 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${selectedVaultId === vault.id ? 'bg-green-500' : 'bg-zinc-800'}`}>
                                        <span className="text-[10px] font-bold text-black uppercase">{vault.chain.substring(0, 1)}</span>
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <div className={`font-semibold truncate ${selectedVaultId === vault.id ? 'text-green-400' : 'text-zinc-200'}`}>
                                            {vault.name}
                                        </div>
                                        <div className="text-xs text-zinc-500">TVL: {formatTvl(vault.tvl)}</div>
                                    </div>
                                </div>
                                <div className={`shrink-0 font-mono font-bold text-right ${selectedVaultId === vault.id ? 'text-green-400' : 'text-zinc-400'}`}>
                                    {formatPercentage(vault.apy)}
                                    <div className="text-[10px] uppercase opacity-60">APY</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleCalculate}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group shrink-0"
                    disabled={isCalculating || !selectedVault}
                >
                    {isCalculating ? (
                        <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                        <>Calculate Fidelity <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /></>
                    )}
                </button>
            </motion.div>

            {/* Output Panel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-black border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col relative overflow-hidden group h-[600px]"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[80px] group-hover:bg-green-500/10 transition-colors duration-700"></div>

                {calculations ? (
                    <div className="flex flex-col h-full justify-center">
                        <div className="w-full bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6 mb-8 text-center relative z-10 transition-all duration-300 hover:border-green-500/30">
                            <p className="text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wider">Estimated Break-Even Time</p>

                            {calculations.willNeverBreakEven ? (
                                <div className="flex items-center justify-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600 font-mono">
                                    Never
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-baseline justify-center gap-2 font-mono">
                                        <span className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                                            {calculations.breakEvenDays}
                                        </span>
                                        <span className="text-2xl font-bold text-zinc-500">Days</span>
                                    </div>
                                    <p className="text-sm text-green-400 mt-2 font-medium flex items-center justify-center gap-1">
                                        <Zap className="w-3 h-3" /> Profitable by {calculations.breakEvenDate}
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="w-full space-y-4 relative z-10">
                            <h4 className="text-white font-semibold flex items-center gap-2 border-b border-white/5 pb-2">
                                Yield Breakdown <Info className="w-4 h-4 text-zinc-500" />
                            </h4>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400">Projected Daily Yield</span>
                                <span className="text-green-400 font-mono font-medium">+{formatCurrency(calculations.dailyYield)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400">Gas Entry (Base L2)</span>
                                <span className="text-destructive font-mono opacity-80">-{formatCurrency(calculations.gasEntry)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400">Gas Exit (Estimated)</span>
                                <span className="text-destructive font-mono opacity-80">-{formatCurrency(calculations.gasExit)}</span>
                            </div>

                            <div className="pt-4 mt-4 border-t border-white/5 flex justify-between items-center bg-zinc-900/40 p-3 rounded-lg">
                                <span className="text-white font-medium text-sm">Target APY</span>
                                <span className="text-amber-400 font-mono font-bold text-lg">{selectedVault ? formatPercentage(selectedVault.apy) : '0%'}</span>
                            </div>
                        </div>

                        <div className={`mt-auto w-full p-4 rounded-xl border flex items-start gap-3 transition-colors ${calculations.breakEvenDays > 30 || calculations.willNeverBreakEven
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : calculations.breakEvenDays > 7
                                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                    : 'bg-green-500/10 border-green-500/20 text-green-400'
                            }`}>
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm">
                                {calculations.willNeverBreakEven
                                    ? "At this rate, your yield will never cover the gas costs due to 0% APY."
                                    : calculations.breakEvenDays > 30
                                        ? `Warning: Your gas costs (${formatCurrency(calculations.totalGasCost)}) take over a month to recover. Consider a larger deposit.`
                                        : `Excellent! You will break even quickly on this strategy.`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
                        <Info className="w-12 h-12 opacity-20" />
                        <p className="text-sm text-center max-w-[200px]">Enter a deposit amount and select a strategy to calculate fidelity.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
