import { NextResponse } from 'next/server';
import { getBaseVaultMarketData } from '@/lib/beefy';
import { getBaseGasEstimate } from '@/lib/baseGas';
import { baseChain } from '@/lib/chains';

export const dynamic = 'force-dynamic';

export async function GET() {
    const requestId = crypto.randomUUID();
    try {
        const marketData = await getBaseVaultMarketData();
        const gas = await getBaseGasEstimate(marketData.ethPriceUsd);

        return NextResponse.json({
            vaults: marketData.vaults.map((vault) => ({
                id: vault.id,
                name: vault.name,
                chain: vault.chain,
                tvl: vault.tvl,
                apy: vault.apy,
                performanceFee: vault.performanceFee,
                earnContractAddress: vault.earnContractAddress,
                tokenAddress: vault.tokenAddress,
                token: vault.token,
            })),
            gas,
            source: {
                chain: baseChain.name,
                chainId: baseChain.chainId,
                beefyFetchedAt: marketData.fetchedAt,
                requestId,
            },
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
                'X-Request-Id': requestId,
            },
        });
    } catch (error) {
        console.error('Calculator data API failed:', { requestId, error });
        return NextResponse.json({
            code: 'UPSTREAM_UNAVAILABLE',
            message: 'Live vault or network data is temporarily unavailable.',
            requestId,
        }, {
            status: 502,
            headers: { 'X-Request-Id': requestId },
        });
    }
}
