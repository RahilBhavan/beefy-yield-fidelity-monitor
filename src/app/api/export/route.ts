import { NextResponse } from 'next/server';
import { createSupabaseReader, hasSupabaseReaderConfiguration } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const EXPORT_COLUMNS = [
    'vault_id',
    'snapshot_date',
    'recorded_at',
    'price_per_share',
    'target_apy',
    'tvl',
    'chain_id',
    'contract_address',
    'block_number',
    'block_hash',
    'provider_label',
    'validation_status',
] as const;

export function csvCell(value: unknown) {
    const text = value === null || value === undefined ? '' : String(value);
    // Neutralize spreadsheet formula injection by prefixing =, +, -, @ cells with a quote.
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
    const requestId = crypto.randomUUID();
    if (!hasSupabaseReaderConfiguration()) {
        return NextResponse.json(
            { code: 'DATA_NOT_CONFIGURED', message: 'Observation export is not configured.', requestId },
            { status: 503 },
        );
    }

    try {
        const url = new URL(request.url);
        const format = url.searchParams.get('format') ?? 'csv';
        const vaultId = url.searchParams.get('vaultId');
        if (!['csv', 'json'].includes(format)) {
            return NextResponse.json(
                { code: 'INVALID_FORMAT', message: 'format must be csv or json', requestId },
                { status: 400 },
            );
        }

        let query = createSupabaseReader()
            .from('pps_history')
            .select(EXPORT_COLUMNS.join(','))
            .eq('validation_status', 'valid')
            .order('recorded_at', { ascending: false })
            .limit(10_000);
        if (vaultId) query = query.eq('vault_id', vaultId);

        const { data, error } = await query;
        if (error) throw error;
        const rows = data ?? [];
        const headers = {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'X-Request-Id': requestId,
        };

        if (format === 'json') return NextResponse.json({ data: rows, requestId }, { headers });

        const csv = [
            EXPORT_COLUMNS.join(','),
            ...rows.map((row) => EXPORT_COLUMNS.map(
                (column) => csvCell((row as unknown as Record<string, unknown>)[column]),
            ).join(',')),
        ].join('\n');
        return new Response(csv, {
            headers: {
                ...headers,
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="beefy-yield-observations.csv"',
            },
        });
    } catch (error) {
        console.error('Observation export failed:', { requestId, error });
        return NextResponse.json(
            { code: 'EXPORT_FAILED', message: 'Observation export is temporarily unavailable.', requestId },
            { status: 502 },
        );
    }
}
