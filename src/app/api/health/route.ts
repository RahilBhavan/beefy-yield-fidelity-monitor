import { NextResponse } from 'next/server';
import { baseChain, createChainProvider, withRpcRetry } from '@/lib/chains';
import { createSupabaseReader, hasSupabaseReaderConfiguration } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    const requestId = crypto.randomUUID();
    const checkedAt = new Date();
    const configured = hasSupabaseReaderConfiguration();

    try {
        const provider = createChainProvider(baseChain);
        const blockPromise = withRpcRetry(() => provider.getBlockNumber());
        const snapshotPromise = configured
            ? createSupabaseReader()
                .from('pps_history')
                .select('recorded_at,block_number')
                .eq('validation_status', 'valid')
                .order('recorded_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null });
        const [blockNumber, snapshotResult] = await Promise.all([blockPromise, snapshotPromise]);
        if (snapshotResult.error) throw snapshotResult.error;

        const latestSnapshotAt = snapshotResult.data?.recorded_at ?? null;
        const ageHours = latestSnapshotAt
            ? (checkedAt.getTime() - Date.parse(latestSnapshotAt)) / 3_600_000
            : null;
        const status = !configured || ageHours === null || ageHours > 36 ? 'degraded' : 'ok';

        return NextResponse.json({
            status,
            checkedAt: checkedAt.toISOString(),
            chain: {
                slug: baseChain.slug,
                chainId: baseChain.chainId,
                blockNumber,
                providersConfigured: baseChain.rpcUrls.length,
            },
            database: {
                configured,
                latestSnapshotAt,
                latestSnapshotBlock: snapshotResult.data?.block_number ?? null,
                ageHours,
            },
            requestId,
        }, {
            status: status === 'ok' ? 200 : 503,
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                'X-Request-Id': requestId,
            },
        });
    } catch (error) {
        console.error('Health check failed:', { requestId, error });
        return NextResponse.json({
            status: 'unavailable',
            checkedAt: checkedAt.toISOString(),
            requestId,
        }, { status: 503, headers: { 'X-Request-Id': requestId } });
    }
}
