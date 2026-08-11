import { isAddress, isHexString } from 'ethers';
import { NextResponse } from 'next/server';
import { getBaseVaultMarketData } from '@/lib/beefy';
import { estimatePreparedTransaction } from '@/lib/transactionGas';

export const dynamic = 'force-dynamic';

interface EstimateRequest {
    from?: unknown;
    to?: unknown;
    data?: unknown;
    valueWei?: unknown;
}

export async function POST(request: Request) {
    const requestId = crypto.randomUUID();
    try {
        const body = await request.json() as EstimateRequest;
        if (
            typeof body.from !== 'string'
            || typeof body.to !== 'string'
            || typeof body.data !== 'string'
            || !isAddress(body.from)
            || !isAddress(body.to)
            || !isHexString(body.data)
            || body.data.length > 20_002
        ) {
            return NextResponse.json({
                code: 'INVALID_TRANSACTION',
                message: 'A valid from, vault address, and calldata payload are required.',
                requestId,
            }, { status: 400 });
        }

        const from = body.from as string;
        const target = body.to as string;
        const data = body.data as string;
        const marketData = await getBaseVaultMarketData();
        const allowedVault = marketData.vaults.some(
            (vault) => vault.earnContractAddress.toLowerCase() === target.toLowerCase(),
        );
        if (!allowedVault) {
            return NextResponse.json({
                code: 'UNSUPPORTED_TARGET',
                message: 'The transaction target is not an active tracked Base vault.',
                requestId,
            }, { status: 400 });
        }

        let value = BigInt(0);
        if (body.valueWei !== undefined) {
            if (typeof body.valueWei !== 'string' || !/^\d+$/.test(body.valueWei)) {
                return NextResponse.json({ code: 'INVALID_VALUE', message: 'valueWei must be an integer string.', requestId }, { status: 400 });
            }
            value = BigInt(body.valueWei);
        }

        const estimate = await estimatePreparedTransaction({
            from,
            to: target,
            data,
            value,
        }, marketData.ethPriceUsd);

        return NextResponse.json({ estimate, requestId }, {
            headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId },
        });
    } catch (error) {
        console.error('Prepared transaction simulation failed:', { requestId, error });
        return NextResponse.json({
            code: 'SIMULATION_FAILED',
            message: 'The prepared transaction could not be simulated. Check wallet balance, allowance, and calldata.',
            requestId,
        }, { status: 422 });
    }
}
