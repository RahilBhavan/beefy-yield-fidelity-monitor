import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

const BASE_RPC_URL = 'https://mainnet.base.org';

interface VaultData {
    id: string;
    name: string;
    chain: string;
    tvl?: number;
    [key: string]: unknown;
}

export async function GET() {
    try {
        // 1. Fetch Beefy Data for Base Chain
        const [vaultsRes, apyRes, tvlRes, lpsRes] = await Promise.all([
            fetch('https://api.beefy.finance/vaults'),
            fetch('https://api.beefy.finance/apy/breakdown'),
            fetch('https://api.beefy.finance/tvl'),
            fetch('https://api.beefy.finance/lps') // For token prices if needed, using ETH for gas
        ]);

        const vaults = await vaultsRes.json();
        const apys = await apyRes.json();
        const tvls = await tvlRes.json();
        const tokenPrices = await lpsRes.json();

        // Filter only Base vaults
        const baseVaults = vaults.filter((v: VaultData) => v.chain === 'base');

        // Attach APY and TVL
        const enrichedVaults = baseVaults.map((vault: VaultData) => {
            const apyData: { totalApy?: number, vaultApr?: number } = apys[vault.id] || {};
            const tvl = tvls[vault.chain]?.[vault.id] || 0;
            return {
                id: vault.id,
                name: vault.name,
                chain: vault.chain,
                tvl: tvl,
                apy: apyData.totalApy || 0,
                dailyYield: (apyData.totalApy || 0) / 365,
                fee: apyData.vaultApr ? ((apyData.totalApy || 0) - apyData.vaultApr) : 0 // Rough estimation of performance fee diff
            };
        }).sort((a: { tvl: number }, b: { tvl: number }) => b.tvl - a.tvl) // Sort by TVL
            .slice(0, 50); // Top 50 vaults

        // 2. Fetch Gas Data from Base using Ethers
        const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
        const feeData = await provider.getFeeData();

        // Gas Price in Gwei
        const gasPriceGwei = feeData.gasPrice
            ? ethers.formatUnits(feeData.gasPrice, 'gwei')
            : "0";

        // Standard transactions for vault deposit/withdraw (e.g. 500k gas each)
        const txGasLimit = BigInt(500000);
        const estimatedGasCostWei = feeData.gasPrice
            ? feeData.gasPrice * txGasLimit * BigInt(2) // Entry + Exit
            : BigInt(0);

        const estimatedGasCostEth = ethers.formatEther(estimatedGasCostWei);

        // Get ETH price from Beefy's price endpoint or mock (approx)
        const ethPrice = tokenPrices['ETH'] || 3500;
        const gasCostUsd = parseFloat(estimatedGasCostEth) * ethPrice;

        return NextResponse.json({
            vaults: enrichedVaults,
            gas: {
                priceGwei: gasPriceGwei,
                estimatedCostUsd: gasCostUsd,
                ethPrice: ethPrice
            }
        });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
