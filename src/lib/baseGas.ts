import { Contract, formatEther } from 'ethers';
import { baseChain, createChainProvider, withRpcRetry } from '@/lib/chains';
import { unstable_cache } from 'next/cache';

const ENTRY_GAS_LIMIT = BigInt(500_000);
const EXIT_GAS_LIMIT = BigInt(500_000);
const ENTRY_TRANSACTION_BYTES = BigInt(350);
const EXIT_TRANSACTION_BYTES = BigInt(300);

const GAS_ORACLE_ABI = [
    'function getL1FeeUpperBound(uint256 unsignedTxSize) view returns (uint256)',
];

export interface GasEstimate {
    priceGwei: string;
    entryCostUsd: number;
    exitCostUsd: number;
    estimatedCostUsd: number;
    ethPrice: number;
    assumptions: string;
    estimatedAt: string;
}

interface GasNetworkSnapshot {
    gasPriceWei: string;
    entryL1FeeWei: string;
    exitL1FeeWei: string;
    estimatedAt: string;
}

export function combineGasCosts(
    gasPriceWei: bigint,
    entryL1FeeWei: bigint,
    exitL1FeeWei: bigint,
    ethPriceUsd: number,
): Pick<GasEstimate, 'entryCostUsd' | 'exitCostUsd' | 'estimatedCostUsd'> {
    const entryWei = gasPriceWei * ENTRY_GAS_LIMIT + entryL1FeeWei;
    const exitWei = gasPriceWei * EXIT_GAS_LIMIT + exitL1FeeWei;
    const entryCostUsd = Number(formatEther(entryWei)) * ethPriceUsd;
    const exitCostUsd = Number(formatEther(exitWei)) * ethPriceUsd;

    return {
        entryCostUsd,
        exitCostUsd,
        estimatedCostUsd: entryCostUsd + exitCostUsd,
    };
}

async function loadBaseGasNetworkSnapshot(): Promise<GasNetworkSnapshot> {
    const provider = createChainProvider(baseChain);
    const oracle = new Contract(baseChain.gasOracleAddress, GAS_ORACLE_ABI, provider);

    const [feeData, entryL1FeeWei, exitL1FeeWei] = await Promise.all([
        withRpcRetry(() => provider.getFeeData()),
        withRpcRetry(() => oracle.getL1FeeUpperBound(ENTRY_TRANSACTION_BYTES) as Promise<bigint>),
        withRpcRetry(() => oracle.getL1FeeUpperBound(EXIT_TRANSACTION_BYTES) as Promise<bigint>),
    ]);

    if (!feeData.gasPrice) {
        throw new Error('Base RPC did not return a gas price');
    }

    return {
        gasPriceWei: feeData.gasPrice.toString(),
        entryL1FeeWei: entryL1FeeWei.toString(),
        exitL1FeeWei: exitL1FeeWei.toString(),
        estimatedAt: new Date().toISOString(),
    };
}

let gasNetworkLoad: Promise<GasNetworkSnapshot> | null = null;

function loadBaseGasNetworkSnapshotOnce(): Promise<GasNetworkSnapshot> {
    if (!gasNetworkLoad) {
        gasNetworkLoad = loadBaseGasNetworkSnapshot().finally(() => {
            gasNetworkLoad = null;
        });
    }
    return gasNetworkLoad;
}

const getCachedBaseGasNetworkSnapshot = unstable_cache(
    loadBaseGasNetworkSnapshotOnce,
    ['base-gas-network-snapshot-v2'],
    { revalidate: 30 },
);

export async function getBaseGasEstimate(ethPriceUsd: number): Promise<GasEstimate> {
    const snapshot = await getCachedBaseGasNetworkSnapshot();
    const gasPriceWei = BigInt(snapshot.gasPriceWei);
    const costs = combineGasCosts(
        gasPriceWei,
        BigInt(snapshot.entryL1FeeWei),
        BigInt(snapshot.exitL1FeeWei),
        ethPriceUsd,
    );

    return {
        priceGwei: (Number(gasPriceWei) / 1e9).toString(),
        ...costs,
        ethPrice: ethPriceUsd,
        assumptions: 'Representative 500k-gas deposit and withdrawal; includes Base L1 fee upper bounds.',
        estimatedAt: snapshot.estimatedAt,
    };
}
