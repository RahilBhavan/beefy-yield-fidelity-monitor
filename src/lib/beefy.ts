import { baseChain } from '@/lib/chains';
import { unstable_cache } from 'next/cache';

const BEEFY_API_URL = 'https://api.beefy.finance';
const DEFAULT_REVALIDATE_SECONDS = 60;

export interface BeefyVaultResponse {
    id: string;
    name: string;
    chain: string;
    status?: string;
    earnContractAddress?: string;
    tokenAddress?: string;
    token?: string;
}

interface BeefyApyBreakdown {
    totalApy?: number;
    beefyPerformanceFee?: number;
}

export interface BaseVault {
    id: string;
    name: string;
    chain: 'base';
    earnContractAddress: string;
    tokenAddress: string | null;
    token: string | null;
    tvl: number;
    apy: number;
    performanceFee: number;
}

type JsonRecord = Record<string, unknown>;

async function fetchJson<T>(path: string): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            const response = await fetch(`${BEEFY_API_URL}${path}`, {
                cache: 'no-store',
                signal: AbortSignal.timeout(8_000),
            });

            if (!response.ok) {
                const error = new Error(`Beefy ${path} returned ${response.status}`);
                if (response.status < 500 && response.status !== 429) throw error;
                lastError = error;
            } else {
                return response.json() as Promise<T>;
            }
        } catch (error) {
            lastError = error;
        }

        if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 150));
        }
    }

    throw lastError instanceof Error ? lastError : new Error(`Beefy ${path} failed`);
}

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function selectActiveBaseVaults(
    vaults: BeefyVaultResponse[],
    apys: Record<string, BeefyApyBreakdown>,
    tvlsByChainId: Record<string, Record<string, number>>,
    limit = 50,
): BaseVault[] {
    const baseTvls = tvlsByChainId[String(baseChain.chainId)] ?? {};

    return vaults
        .filter((vault) => (
            vault.chain === 'base'
            && vault.status === 'active'
            && typeof vault.earnContractAddress === 'string'
        ))
        .map((vault) => {
            const breakdown = apys[vault.id] ?? {};
            const tvl = Number(baseTvls[vault.id] ?? 0);
            const apy = Number(breakdown.totalApy ?? 0);
            const performanceFee = Number(breakdown.beefyPerformanceFee ?? 0);

            return {
                id: vault.id,
                name: vault.name,
                chain: 'base' as const,
                earnContractAddress: vault.earnContractAddress as string,
                tokenAddress: vault.tokenAddress ?? null,
                token: vault.token ?? null,
                tvl: Number.isFinite(tvl) ? tvl : 0,
                apy: Number.isFinite(apy) ? apy : 0,
                performanceFee: Number.isFinite(performanceFee) ? performanceFee : 0,
            };
        })
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, limit);
}

async function loadBaseVaultMarketData(limit: number): Promise<{
    vaults: BaseVault[];
    ethPriceUsd: number;
    fetchedAt: string;
}> {
    const [vaults, apys, tvls, prices] = await Promise.all([
        fetchJson<unknown>('/vaults'),
        fetchJson<unknown>('/apy/breakdown'),
        fetchJson<unknown>('/tvl'),
        fetchJson<unknown>('/prices'),
    ]);

    if (!Array.isArray(vaults) || !isRecord(apys) || !isRecord(tvls) || !isRecord(prices)) {
        throw new Error('Beefy returned an unexpected response shape');
    }

    const ethPriceUsd = Number(prices.ETH);
    if (!Number.isFinite(ethPriceUsd) || ethPriceUsd <= 0) {
        throw new Error('Beefy returned an invalid ETH price');
    }

    return {
        vaults: selectActiveBaseVaults(
            vaults as BeefyVaultResponse[],
            apys as Record<string, BeefyApyBreakdown>,
            tvls as Record<string, Record<string, number>>,
            limit,
        ),
        ethPriceUsd,
        fetchedAt: new Date().toISOString(),
    };
}

const getCachedBaseVaultMarketData = unstable_cache(
    async (limit: number) => loadBaseVaultMarketData(limit),
    ['beefy-base-market-data-v1'],
    { revalidate: DEFAULT_REVALIDATE_SECONDS },
);

export function getBaseVaultMarketData(
    limit = 50,
    options: { fresh?: boolean } = {},
) {
    return options.fresh
        ? loadBaseVaultMarketData(limit)
        : getCachedBaseVaultMarketData(limit);
}
