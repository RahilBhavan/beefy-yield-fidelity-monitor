import { Contract, formatEther } from 'ethers';
import { baseChain, createChainProvider, withRpcRetry } from '@/lib/chains';

const GAS_ORACLE_ABI = [
    'function getL1FeeUpperBound(uint256 unsignedTxSize) view returns (uint256)',
];

export interface PreparedTransaction {
    from: string;
    to: string;
    data: string;
    value?: bigint;
}

export async function estimatePreparedTransaction(
    transaction: PreparedTransaction,
    ethPriceUsd: number,
) {
    const provider = createChainProvider(baseChain);
    const oracle = new Contract(baseChain.gasOracleAddress, GAS_ORACLE_ABI, provider);
    const transactionBytes = BigInt(Math.ceil((transaction.data.length - 2) / 2) + 160);

    const gasLimit = await withRpcRetry(() => provider.estimateGas(transaction));
    const feeData = await withRpcRetry(() => provider.getFeeData());
    const l1FeeWei = await withRpcRetry(
        () => oracle.getL1FeeUpperBound(transactionBytes) as Promise<bigint>,
    );
    if (!feeData.gasPrice) throw new Error('Base RPC did not return a gas price');

    const l2FeeWei = gasLimit * feeData.gasPrice;
    const totalFeeWei = l2FeeWei + l1FeeWei;
    return {
        gasLimit: gasLimit.toString(),
        gasPriceGwei: (Number(feeData.gasPrice) / 1e9).toString(),
        l2FeeWei: l2FeeWei.toString(),
        l1FeeUpperBoundWei: l1FeeWei.toString(),
        totalFeeWei: totalFeeWei.toString(),
        totalFeeUsd: Number(formatEther(totalFeeWei)) * ethPriceUsd,
        transactionBytes: Number(transactionBytes),
        blockNumber: await withRpcRetry(() => provider.getBlockNumber()),
        estimatedAt: new Date().toISOString(),
    };
}
