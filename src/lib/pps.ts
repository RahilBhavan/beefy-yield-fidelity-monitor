import { Interface, formatUnits } from 'ethers';
import type { BaseVault } from '@/lib/beefy';
import { baseChain, createChainProvider, withRpcRetry } from '@/lib/chains';

const vaultInterface = new Interface([
    'function getPricePerFullShare() view returns (uint256)',
    'function decimals() view returns (uint8)',
]);

const multicallInterface = new Interface([
    'function aggregate3((address target,bool allowFailure,bytes callData)[] calls) payable returns ((bool success,bytes returnData)[] returnData)',
]);

interface MulticallResult {
    success: boolean;
    returnData: string;
}

export interface PricePerShareSnapshot {
    vaultId: string;
    contractAddress: string;
    pricePerShare: string;
    rawPricePerShare: string;
    decimals: number;
}

export interface OnChainSnapshotBatch {
    blockNumber: number;
    blockHash: string;
    providerLabel: string;
    snapshots: PricePerShareSnapshot[];
    failures: Array<{ vaultId: string; contractAddress: string; reason: string }>;
}

export async function readBasePricePerShares(vaults: BaseVault[]): Promise<OnChainSnapshotBatch> {
    const provider = createChainProvider(baseChain);
    const block = await withRpcRetry(() => provider.getBlock('latest'));
    if (!block?.hash) throw new Error('Base RPC did not return a complete latest block');

    if (vaults.length === 0) {
        return {
            blockNumber: block.number,
            blockHash: block.hash,
            providerLabel: baseChain.providerLabel,
            snapshots: [],
            failures: [],
        };
    }

    const calls = vaults.flatMap((vault) => [
        {
            target: vault.earnContractAddress,
            allowFailure: true,
            callData: vaultInterface.encodeFunctionData('getPricePerFullShare'),
        },
        {
            target: vault.earnContractAddress,
            allowFailure: true,
            callData: vaultInterface.encodeFunctionData('decimals'),
        },
    ]);

    const rawResponse = await withRpcRetry(() => provider.call({
        to: baseChain.multicallAddress,
        data: multicallInterface.encodeFunctionData('aggregate3', [calls]),
        blockTag: block.number,
    }));
    const [decoded] = multicallInterface.decodeFunctionResult('aggregate3', rawResponse);
    const results = decoded as MulticallResult[];

    const snapshots: PricePerShareSnapshot[] = [];
    const failures: OnChainSnapshotBatch['failures'] = [];
    vaults.forEach((vault, index) => {
        const ppsResult = results[index * 2];
        const decimalsResult = results[index * 2 + 1];
        if (!ppsResult?.success || !decimalsResult?.success) {
            failures.push({
                vaultId: vault.id,
                contractAddress: vault.earnContractAddress,
                reason: 'PPS or decimals call reverted',
            });
            return;
        }

        try {
            const [rawPps] = vaultInterface.decodeFunctionResult(
                'getPricePerFullShare',
                ppsResult.returnData,
            );
            const [rawDecimals] = vaultInterface.decodeFunctionResult(
                'decimals',
                decimalsResult.returnData,
            );

            const decimals = Number(rawDecimals);
            snapshots.push({
                vaultId: vault.id,
                contractAddress: vault.earnContractAddress,
                pricePerShare: formatUnits(rawPps, decimals),
                rawPricePerShare: rawPps.toString(),
                decimals,
            });
        } catch {
            failures.push({
                vaultId: vault.id,
                contractAddress: vault.earnContractAddress,
                reason: 'PPS response could not be decoded',
            });
        }
    });

    return {
        blockNumber: block.number,
        blockHash: block.hash,
        providerLabel: baseChain.providerLabel,
        snapshots,
        failures,
    };
}
