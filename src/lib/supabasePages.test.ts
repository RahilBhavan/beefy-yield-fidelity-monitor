import { describe, expect, it } from 'vitest';
import { loadAllPages } from '@/lib/supabasePages';

describe('database pagination', () => {
    it('loads all rows across a capped response and does not duplicate page boundaries', async () => {
        const source = Array.from({ length: 1_001 }, (_, index) => index);
        const requests: Array<[number, number]> = [];
        const rows = await loadAllPages(async (from, to) => {
            requests.push([from, to]);
            return { data: source.slice(from, to + 1), error: null };
        });

        expect(rows).toEqual(source);
        expect(requests).toEqual([[0, 499], [500, 999], [1_000, 1_499]]);
    });

    it('fails instead of returning a partial export when a later page errors', async () => {
        await expect(loadAllPages(async (from) => ({
            data: from === 0 ? Array.from({ length: 500 }, (_, index) => index) : null,
            error: from === 0 ? null : new Error('page unavailable'),
        }))).rejects.toThrow('page unavailable');
    });

    it('fails instead of treating a null later page as the end of the result', async () => {
        const requests: number[] = [];
        await expect(loadAllPages(async (from) => {
            requests.push(from);
            return {
                data: from === 0 ? Array.from({ length: 500 }, (_, index) => index) : null,
                error: null,
            };
        })).rejects.toThrow('Database returned no page data');
        expect(requests).toEqual([0, 500]);
    });
});
