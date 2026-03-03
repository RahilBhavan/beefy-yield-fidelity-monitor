"use client";

import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

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
                if (data.gas) setGasData(data.gas);
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
        const yearlyYield = rawDeposit * selectedVault.apy;
        const dailyYield = yearlyYield / 365;
        const totalGasCost = gasData.estimatedCostUsd;
        const gasEntry = totalGasCost / 2;
        const gasExit = totalGasCost / 2;
        const breakEvenDays = dailyYield > 0 ? totalGasCost / dailyYield : Infinity;

        return {
            dailyYield, gasEntry, gasExit, totalGasCost,
            breakEvenDays: Math.ceil(breakEvenDays),
            willNeverBreakEven: breakEvenDays === Infinity || isNaN(breakEvenDays)
        };
    }, [selectedVault, gasData, rawDeposit]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    const formatPercentage = (val: number) => (val * 100).toFixed(2) + '%';
    const formatTvl = (val: number) => {
        if (val > 1e6) return `$${(val / 1e6).toFixed(1)}M`;
        if (val > 1e3) return `$${(val / 1e3).toFixed(1)}K`;
        return `$${val.toFixed(0)}`;
    };

    if (isLoading) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center font-mono text-[#FE5238] uppercase text-sm tracking-widest animate-pulse">
                Initializing.Systems()
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-[1.5px] border-[#D6D6D6]/30 bg-[#1E1E1E]">

            {/* Input Panel - Brutalist forms */}
            <div className="p-8 border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-[#D6D6D6]/30 flex flex-col space-y-8 bg-[#2A2A2A]">

                <div>
                    <label htmlFor="deposit-input" className="font-mono text-xs font-bold uppercase tracking-wider text-[#D6D6D6] mb-3 block">
                        [INPUT] Intended Deposit Size : USD
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl opacity-50" aria-hidden="true">$</span>
                        <input
                            id="deposit-input"
                            type="number"
                            value={deposit}
                            onChange={(e) => setDeposit(e.target.value)}
                            className="w-full bg-[#1E1E1E] border-[1.5px] border-[#D6D6D6]/30 px-10 py-4 text-3xl font-mono text-[#FE5238] focus:outline-none focus:border-[#FE5238] transition-colors rounded-none placeholder:text-[#1e1e1e]"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#D6D6D6] mb-3 flex items-center justify-between" id="vault-list-label">
                        <span>[SELECT] Target Vault</span>
                        <span className="px-2 py-0.5 border border-[#FE5238] text-[#FE5238] text-[10px]">BASE/L2</span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[250px] border-[1.5px] border-[#D6D6D6]/30 bg-[#1E1E1E]" role="listbox" aria-labelledby="vault-list-label">
                        {vaults.slice(0, 10).map((vault) => (
                            <button
                                key={vault.id}
                                role="option"
                                aria-selected={selectedVaultId === vault.id}
                                onClick={() => setSelectedVaultId(vault.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 border-b border-[#D6D6D6]/10 text-left transition-colors ${selectedVaultId === vault.id
                                    ? 'bg-[#EBEBEB] text-[#1E1E1E]'
                                    : 'text-[#D6D6D6] hover:bg-[#D6D6D6]/10'
                                    }`}
                            >
                                <div>
                                    <div className={`font-bold font-sans ${selectedVaultId === vault.id ? 'text-[#1E1E1E]' : ''}`}>{vault.name}</div>
                                    <div className="text-[10px] font-mono opacity-80 uppercase">TVL: {formatTvl(vault.tvl)}</div>
                                </div>
                                <div className={`font-mono font-bold ${selectedVaultId === vault.id ? 'text-[#FE5238]' : ''}`}>
                                    {formatPercentage(vault.apy)}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Output Panel - High Contrast Output */}
            <div className="p-8 flex flex-col relative bg-[#1E1E1E]">

                {calculations ? (
                    <div className="flex flex-col h-full justify-between">
                        <div className="w-full mb-8">
                            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#D6D6D6] mb-2 border-b-[1.5px] border-[#D6D6D6]/30 pb-2">
                                [OUTPUT] Fidelity Forecast
                            </div>

                            <div className="mt-8 flex flex-col items-center justify-center text-center">
                                <p className="font-mono text-xs uppercase text-zinc-500 mb-2">Break-Even Point</p>
                                {calculations.willNeverBreakEven ? (
                                    <div className="text-4xl lg:text-5xl font-black tracking-tighter text-[#FE5238]">NEVER_YIELD</div>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-7xl lg:text-8xl font-black tracking-tighter text-[#EBEBEB]">{calculations.breakEvenDays}</span>
                                        <span className="font-mono font-bold uppercase text-xl text-[#FE5238]">Days</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full font-mono text-xs uppercase font-bold text-[#D6D6D6] space-y-3 mt-auto">
                            <div className="flex justify-between border-b border-[#D6D6D6]/10 pb-1">
                                <span>Daily ROI Rate</span>
                                <span className="text-green-500">+{formatCurrency(calculations.dailyYield)}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#D6D6D6]/10 pb-1">
                                <span>L2 Entry Fee</span>
                                <span className="text-[#FE5238] opacity-80">-{formatCurrency(calculations.gasEntry)}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#D6D6D6]/10 pb-1">
                                <span>L2 Exit Forecast</span>
                                <span className="text-[#FE5238] opacity-80">-{formatCurrency(calculations.gasExit)}</span>
                            </div>

                            <div className="pt-2 flex justify-between bg-[#EBEBEB] text-[#1E1E1E] p-2">
                                <span>Total Friction</span>
                                <span className="font-black text-[#FE5238]">{formatCurrency(calculations.totalGasCost)}</span>
                            </div>
                        </div>

                        {calculations.breakEvenDays > 30 && !calculations.willNeverBreakEven && (
                            <div className="mt-6 border-[1.5px] border-[#FE5238] p-3 flex gap-3 text-[#FE5238] items-start bg-[#FE5238]/10">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p className="font-mono text-[10px] uppercase font-bold leading-tight">
                                    Warning Override: Deposit density insufficient to offset systemic gas friction inside 30 cycles. Adjust input loadout.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center font-mono text-[#D6D6D6]/50 text-xs px-10 text-center border-[1.5px] border-dashed border-[#D6D6D6]/20">
                        Awaiting variable assignments to execute forecast logic.
                    </div>
                )}
            </div>
        </div>
    );
}
