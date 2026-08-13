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

// ponytail: per-instance in-memory limiter; move to durable store if multi-instance abuse appears
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const requestCounts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    for (const [key, entry] of requestCounts) {
        if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) requestCounts.delete(key);
    }
    const entry = requestCounts.get(ip);
    if (!entry) {
        requestCounts.set(ip, { count: 1, windowStart: now });
        return false;
    }
    entry.count += 1;
    return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: Request) {
    const requestId = crypto.randomUUID();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
        return NextResponse.json({
            code: 'RATE_LIMITED',
            message: 'Too many gas estimate requests. Try again in a minute.',
            requestId,
        }, { status: 429 });
    }
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
