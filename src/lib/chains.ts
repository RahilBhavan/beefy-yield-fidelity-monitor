export interface ChainAdapter {
    slug: string;
    chainId: number;
    name: string;
    nativeSymbol: string;
    rpcUrls: string[];
    providerLabel: string;
    explorerUrl: string;
    multicallAddress: string;
    gasOracleAddress: string;
}

export const baseChain: ChainAdapter = {
    slug: 'base',
    chainId: 8453,
    name: 'Base',
    nativeSymbol: 'ETH',
    rpcUrls: Array.from(new Set([
        ...(process.env.BASE_RPC_URLS ?? process.env.BASE_RPC_URL ?? '')
            .split(',')
            .map((url) => url.trim())
            .filter(Boolean),
        'https://mainnet.base.org',
    ])),
    providerLabel: process.env.BASE_RPC_PROVIDER_LABEL || 'base-public-rpc',
    explorerUrl: 'https://basescan.org',
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
    gasOracleAddress: '0x420000000000000000000000000000000000000F',
};

export const supportedChains = [baseChain] as const;

export function getChainAdapter(slug: string): ChainAdapter | null {
    return supportedChains.find((chain) => chain.slug === slug) ?? null;
}

export function createChainProvider(chain: ChainAdapter): AbstractProvider {
    const providers = chain.rpcUrls.map((url) => new JsonRpcProvider(url));
    return providers.length === 1 ? providers[0] : new FallbackProvider(providers);
}

export async function withRpcRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 200));
            }
        }
    }
    throw lastError instanceof Error ? lastError : new Error('RPC operation failed');
}
import { AbstractProvider, FallbackProvider, JsonRpcProvider } from 'ethers';
