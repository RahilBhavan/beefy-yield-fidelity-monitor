"use client";

import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { buildBreakEvenScenarios, calculateBreakEven } from '@/lib/yield';
import Link from 'next/link';

interface Vault {
    id: string;
    name: string;
    chain: string;
    tvl: number;
    apy: number;
    performanceFee: number;
}

interface GasData {
    priceGwei: string;
    entryCostUsd: number;
    exitCostUsd: number;
    estimatedCostUsd: number;
    ethPrice: number;
    assumptions: string;
    estimatedAt: string;
}

interface SourceData {
    beefyFetchedAt: string;
    chainId: number;
    requestId: string;
}

export function Calculator() {
    const [deposit, setDeposit] = useState<string>('1000');
    const [selectedVaultId, setSelectedVaultId] = useState<string>('');
    const [vaultSearch, setVaultSearch] = useState<string>('');

    const [vaults, setVaults] = useState<Vault[]>([]);
    const [gasData, setGasData] = useState<GasData | null>(null);
    const [sourceData, setSourceData] = useState<SourceData | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/data');
                if (!res.ok) throw new Error(`Data service returned ${res.status}`);
                const data = await res.json();
                if (data.vaults) {
                    setVaults(data.vaults);
                    if (data.vaults.length > 0) {
                        setSelectedVaultId(data.vaults[0].id);
                    }
                }
                if (data.gas) setGasData(data.gas);
                if (data.source) setSourceData(data.source);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setLoadError('Live vault or network data is temporarily unavailable.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const selectedVault = useMemo(() => vaults.find(v => v.id === selectedVaultId) || null, [vaults, selectedVaultId]);
    const filteredVaults = useMemo(() => {
        const query = vaultSearch.trim().toLowerCase();
        if (!query) return vaults;

        return vaults.filter((vault) =>
            [vault.name, vault.id, vault.chain].some((value) => value.toLowerCase().includes(query))
        );
    }, [vaults, vaultSearch]);
    const rawDeposit = parseFloat(deposit) || 0;

    const calculations = useMemo(() => {
        if (!selectedVault || !gasData || rawDeposit <= 0) return null;
        const result = calculateBreakEven(
            rawDeposit,
            selectedVault.apy,
            gasData.entryCostUsd,
            gasData.exitCostUsd,
        );

        return {
            dailyYield: result.dailyYieldUsd,
            gasEntry: gasData.entryCostUsd,
            gasExit: gasData.exitCostUsd,
            totalGasCost: result.totalGasCostUsd,
            breakEvenDays: result.breakEvenDays,
            willNeverBreakEven: result.breakEvenDays === null,
        };
    }, [selectedVault, gasData, rawDeposit]);

    const scenarios = useMemo(() => {
        if (!selectedVault || !gasData || rawDeposit <= 0) return [];
        return buildBreakEvenScenarios(
            rawDeposit,
            selectedVault.apy,
            gasData.entryCostUsd,
            gasData.exitCostUsd,
        );
    }, [selectedVault, gasData, rawDeposit]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    const formatPercentage = (val: number) => (val * 100).toFixed(2) + '%';
    const formatTvl = (val: number) => {
        if (val > 1e6) return `$${(val / 1e6).toFixed(1)}M`;
        if (val > 1e3) return `$${(val / 1e3).toFixed(1)}K`;
        return `$${val.toFixed(0)}`;
    };
    const formatTimestamp = (value: string) => new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    }).format(new Date(value));

    if (isLoading) {
        return (
            <div
                className="grid min-h-[500px] grid-cols-1 border-[1.5px] border-[#D6D6D6]/30 bg-[#1E1E1E] md:grid-cols-2"
                aria-busy="true"
                aria-live="polite"
            >
                <div className="flex flex-col gap-8 border-b-[1.5px] border-[#D6D6D6]/30 bg-[#2A2A2A] p-8 md:border-b-0 md:border-r-[1.5px]">
                    <div className="h-24 animate-pulse bg-[#D6D6D6]/10" aria-hidden="true" />
                    <div className="min-h-64 flex-1 animate-pulse bg-[#D6D6D6]/10" aria-hidden="true" />
                </div>
                <div className="flex min-h-[320px] items-center justify-center p-8 font-mono text-sm text-[#FE5238]">
                    <p role="status">Loading current vault rates and network fee estimates…</p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div role="alert" className="w-full min-h-[320px] border-[1.5px] border-[#FE5238] p-8 flex flex-col items-center justify-center text-center gap-5">
                <AlertTriangle className="w-8 h-8 text-[#FE5238]" />
                <p className="font-mono text-sm uppercase font-bold">{loadError}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="border-[1.5px] border-[#D6D6D6] px-5 py-3 font-mono text-xs uppercase font-bold hover:bg-[#D6D6D6] hover:text-[#1E1E1E]"
                >
                    Retry
                </button>
                <Link href="/methodology" className="font-mono text-xs uppercase underline hover:text-[#FE5238]">
                    Methodology and limitations
                </Link>
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
                            className="w-full bg-[#1E1E1E] border-[1.5px] border-[#D6D6D6]/60 px-10 py-4 text-3xl font-mono text-[#FE5238] focus:outline-none focus:border-[#FE5238] transition-colors rounded-none"
                            min="0"
                            step="any"
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#D6D6D6] mb-3 flex items-center justify-between" id="vault-list-label">
                        <span>[SELECT] Target Vault</span>
                        <span className="px-2 py-0.5 border border-[#FF765F] text-[#FF765F] text-xs">BASE/L2</span>
                    </div>
                    <label htmlFor="vault-search" className="sr-only">Search vaults</label>
                    <input
                        id="vault-search"
                        type="search"
                        value={vaultSearch}
                        onChange={(event) => setVaultSearch(event.target.value)}
                        placeholder="Search by vault or chain"
                        className="mb-2 w-full rounded-none border-[1.5px] border-[#D6D6D6]/30 bg-[#1E1E1E] px-4 py-3 font-mono text-sm text-[#EBEBEB] placeholder:text-[#AFAFAF] focus:border-[#FE5238] focus:outline-none"
                    />
                    <p className="mb-2 font-mono text-xs text-[#D6D6D6]" aria-live="polite">
                        Showing {filteredVaults.length} of {vaults.length} vaults
                    </p>
                    <ul className="flex-1 overflow-y-auto max-h-[250px] border-[1.5px] border-[#D6D6D6]/30 bg-[#1E1E1E]" aria-labelledby="vault-list-label">
                        {filteredVaults.map((vault) => (
                            <li key={vault.id}>
                                <button
                                    type="button"
                                    aria-pressed={selectedVaultId === vault.id}
                                    onClick={() => setSelectedVaultId(vault.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 border-b border-[#D6D6D6]/10 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#FE5238] ${selectedVaultId === vault.id
                                        ? 'bg-[#EBEBEB] text-[#1E1E1E]'
                                        : 'text-[#D6D6D6] hover:bg-[#D6D6D6]/10'
                                        }`}
                                >
                                    <span>
                                        <span className={`block font-bold font-sans ${selectedVaultId === vault.id ? 'text-[#1E1E1E]' : ''}`}>{vault.name}</span>
                                        <span className="block text-xs font-mono opacity-80 uppercase">TVL: {formatTvl(vault.tvl)}</span>
                                    </span>
                                    <span className={`font-mono font-bold ${selectedVaultId === vault.id ? 'text-[#A82A18]' : ''}`}>
                                        {formatPercentage(vault.apy)}
                                    </span>
                                </button>
                            </li>
                        ))}
                        {filteredVaults.length === 0 && (
                            <li className="px-4 py-8 text-center font-mono text-sm text-[#D6D6D6]">
                                No vaults match your search.
                            </li>
                        )}
                    </ul>
                </div>

            </div>

            {/* Output Panel - High Contrast Output */}
            <div className="p-8 flex flex-col relative bg-[#1E1E1E]">

                {calculations ? (
                    <div className="flex flex-col h-full justify-between">
                        <div className="w-full mb-8">
                            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#D6D6D6] mb-2 border-b-[1.5px] border-[#D6D6D6]/30 pb-2">
                                Break-even estimate
                            </div>

                            <div className="mt-8 flex flex-col items-center justify-center text-center">
                                <p className="font-mono text-xs uppercase text-[#AFAFAF] mb-2">Estimated time to recover fees</p>
                                <p className="sr-only" role="status" aria-live="polite">
                                    {calculations.willNeverBreakEven
                                        ? 'No break-even is projected at the current deposit and APY.'
                                        : `Estimated time to recover fees: ${calculations.breakEvenDays} days.`}
                                </p>
                                {calculations.willNeverBreakEven ? (
                                    <div className="text-4xl lg:text-5xl font-black tracking-tighter text-[#FE5238]">No break-even</div>
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
                                <span>Estimated daily earnings</span>
                                <span className="text-green-500">+{formatCurrency(calculations.dailyYield)}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#D6D6D6]/10 pb-1">
                                <span>Estimated deposit fee</span>
                                <span className="text-[#FE5238]">-{formatCurrency(calculations.gasEntry)}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#D6D6D6]/10 pb-1">
                                <span>Estimated withdrawal fee</span>
                                <span className="text-[#FE5238]">-{formatCurrency(calculations.gasExit)}</span>
                            </div>

                            <div className="pt-2 flex justify-between bg-[#EBEBEB] text-[#1E1E1E] p-2">
                                <span>Total estimated fees</span>
                                <span className="font-black text-[#A82A18]">{formatCurrency(calculations.totalGasCost)}</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="mb-3 font-mono text-xs font-bold uppercase text-[#D6D6D6]">Sensitivity analysis</h3>
                            <div
                                className="overflow-x-auto border border-[#D6D6D6]/30"
                                tabIndex={0}
                                role="region"
                                aria-label="Break-even sensitivity table"
                            >
                                <table className="w-full min-w-[420px] font-mono text-xs uppercase text-left">
                                    <caption className="sr-only">Break-even sensitivity under downside, current, and upside assumptions</caption>
                                    <thead className="bg-[#EBEBEB] text-[#1E1E1E]">
                                        <tr><th className="p-2">Scenario</th><th className="p-2">APY</th><th className="p-2">Total fees</th><th className="p-2 text-right">Break-even</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#D6D6D6]/20">
                                        {scenarios.map((scenario) => (
                                            <tr key={scenario.label} className={scenario.label === 'Current' ? 'text-[#FE5238]' : ''}>
                                                <td className="p-2 font-bold">{scenario.label}</td>
                                                <td className="p-2">{formatPercentage(scenario.apy)}</td>
                                                <td className="p-2">{formatCurrency(scenario.totalGasCostUsd)}</td>
                                                <td className="p-2 text-right">{scenario.breakEvenDays === null ? 'N/A' : `${scenario.breakEvenDays} days`}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-2 font-mono text-xs text-[#D6D6D6]/65">
                                Downside assumes 25% lower APY and 50% higher fees; upside assumes 25% higher APY and 25% lower fees.
                            </p>
                        </div>

                        {(calculations.breakEvenDays ?? 0) > 30 && !calculations.willNeverBreakEven && (
                            <div className="mt-6 border-[1.5px] border-[#FE5238] p-3 flex gap-3 text-[#FE5238] items-start bg-[#FE5238]/10">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p className="font-mono text-xs uppercase font-bold leading-tight">
                                    At this deposit size, estimated earnings may take more than 30 days to cover deposit and withdrawal fees.
                                </p>
                            </div>
                        )}

                        {gasData && (
                            <p className="mt-4 font-mono text-xs leading-relaxed text-[#D6D6D6]/75">
                                Network fee estimate updated {formatTimestamp(gasData.estimatedAt)}. {gasData.assumptions}
                                {' '}The displayed APY already includes Beefy&apos;s reported performance fee ({formatPercentage(selectedVault?.performanceFee ?? 0)}).
                                {sourceData && <> Vault rates updated {formatTimestamp(sourceData.beefyFetchedAt)} for chain {sourceData.chainId}.</>}
                                {' '}<Link href="/methodology" className="underline hover:text-[#FE5238]">Methodology and limitations.</Link>
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center font-mono text-[#D6D6D6]/50 text-xs px-10 text-center border-[1.5px] border-dashed border-[#D6D6D6]/20">
                        Choose a vault and enter a deposit greater than $0 to see an estimate.
                    </div>
                )}
            </div>
        </div>
    );
}
