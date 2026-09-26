import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    rows: [] as { vault_id: string; recorded_at: string }[],
    ranges: [] as [number, number][],
    failFrom: -1,
}));

vi.mock('@/lib/supabase', () => ({
    hasSupabaseReaderConfiguration: () => true,
    createSupabaseReader: () => ({
        from: () => {
            let from = 0;
            let to = 0;
            const query = {
                select: () => query,
                eq: () => query,
                gte: () => query,
                order: () => query,
                range: (start: number, end: number) => {
                    from = start;
                    to = end;
                    mocks.ranges.push([start, end]);
                    return query;
                },
                then: (resolve: (value: { data: typeof mocks.rows | null; error: Error | null }) => unknown) => {
                    const result = from === mocks.failFrom
                        ? { data: null, error: new Error('later page failed') }
                        : { data: mocks.rows.slice(from, to + 1), error: null };
                    return Promise.resolve(result).then(resolve);
                },
            };
            return query;
        },
    }),
}));

import { GET } from '@/app/api/export/route';

beforeEach(() => {
    mocks.rows = Array.from({ length: 1_001 }, (_, index) => ({
        vault_id: `vault-${index}`,
        recorded_at: '2026-09-26T00:00:00.000Z',
    }));
    mocks.ranges = [];
    mocks.failFrom = -1;
});

describe('configured observation export', () => {
    it('includes every row beyond the database response cap', async () => {
        const response = await GET(new Request('http://localhost/api/export?format=json'));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data).toHaveLength(1_001);
        expect(body.data[0].vault_id).toBe('vault-0');
        expect(body.data.at(-1).vault_id).toBe('vault-1000');
        expect(mocks.ranges).toEqual([[0, 499], [500, 999], [1_000, 1_499]]);
    });

    it('returns an error instead of a partial export when a later page fails', async () => {
        mocks.failFrom = 500;
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const response = await GET(new Request('http://localhost/api/export?format=json'));
            const body = await response.json();

            expect(response.status).toBe(502);
            expect(body.code).toBe('EXPORT_FAILED');
            expect(body.data).toBeUndefined();
            expect(mocks.ranges).toEqual([[0, 499], [500, 999]]);
        } finally {
            consoleError.mockRestore();
        }
    });
});
