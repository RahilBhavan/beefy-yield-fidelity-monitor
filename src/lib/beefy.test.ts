import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJson, selectActiveBaseVaults } from '@/lib/beefy';

afterEach(() => vi.unstubAllGlobals());

describe('fetchJson', () => {
    it('fails fast on non-retryable 4xx responses', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('missing', { status: 404 }));
        vi.stubGlobal('fetch', fetchMock);

        await expect(fetchJson('/vaults')).rejects.toThrow('Beefy /vaults returned 404');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('retries 5xx responses and returns the eventual success', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response('down', { status: 500 }))
            .mockResolvedValueOnce(Response.json({ ok: true }));
        vi.stubGlobal('fetch', fetchMock);

        await expect(fetchJson('/vaults')).resolves.toEqual({ ok: true });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});

describe('selectActiveBaseVaults', () => {
    it('uses Base chain-id TVL, excludes retired vaults, and sorts by TVL', () => {
        const result = selectActiveBaseVaults(
            [
                { id: 'retired', name: 'Retired', chain: 'base', status: 'eol', earnContractAddress: '0x1' },
                { id: 'small', name: 'Small', chain: 'base', status: 'active', earnContractAddress: '0x2' },
                { id: 'large', name: 'Large', chain: 'base', status: 'active', earnContractAddress: '0x3' },
                { id: 'other', name: 'Other', chain: 'arbitrum', status: 'active', earnContractAddress: '0x4' },
            ],
            { small: { totalApy: 0.1 }, large: { totalApy: 0.2 } },
            { '8453': { small: 10, large: 100, retired: 1_000 } },
        );

        expect(result.map((vault) => vault.id)).toEqual(['large', 'small']);
        expect(result.map((vault) => vault.tvl)).toEqual([100, 10]);
    });
});
