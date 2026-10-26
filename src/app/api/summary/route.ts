import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/dashboard';
import { buildHeadlineSummary } from '@/lib/summary';

export const dynamic = 'force-dynamic';

export async function GET() {
    const requestId = crypto.randomUUID();
    const summary = buildHeadlineSummary(await getDashboardData());
    if (!summary) {
        return NextResponse.json(
            { code: 'SUMMARY_UNAVAILABLE', message: 'No recorded snapshot is available.', requestId },
            { status: 503, headers: { 'X-Request-Id': requestId } },
        );
    }
    return NextResponse.json({ ...summary, requestId }, {
        headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'X-Request-Id': requestId,
        },
    });
}
