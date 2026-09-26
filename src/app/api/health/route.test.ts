import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    configured: true,
    activeVaultIds: ['vault-1', 'vault-2'],
    coveredVaultIds: ['vault-1', 'vault-2'],
    latestSnapshotAt: '',
}));

vi.mock('@/lib/chains', () => ({
    baseChain: { slug: 'base', chainId: 8453, rpcUrls: ['https://rpc.example'] },
    createChainProvider: () => ({ getBlockNumber: async () => 123 }),
    withRpcRetry: (operation: () => Promise<number>) => operation(),
}));

vi.mock('@/lib/supabase', () => ({
    hasSupabaseReaderConfiguration: () => mocks.configured,
    createSupabaseReader: () => ({
        from: (table: string) => {
            const query = {
                select: () => query,
                eq: () => query,
                order: () => query,
                limit: () => query,
                maybeSingle: async () => ({
                    data: {
                        recorded_at: mocks.latestSnapshotAt,
                        block_number: 100,
                        snapshot_date: mocks.latestSnapshotAt.slice(0, 10),
                    },
                    error: null,
                }),
                then: (resolve: (value: { data: { id?: string; vault_id?: string }[]; error: null }) => unknown) => {
                    const data = table === 'vaults'
                        ? mocks.activeVaultIds.map((id) => ({ id }))
                        : mocks.coveredVaultIds.map((vault_id) => ({ vault_id }));
                    return Promise.resolve({ data, error: null }).then(resolve);
                },
            };
            return query;
        },
    }),
}));

import { GET } from '@/app/api/health/route';

beforeEach(() => {
    mocks.configured = true;
    mocks.activeVaultIds = ['vault-1', 'vault-2'];
    mocks.coveredVaultIds = ['vault-1', 'vault-2'];
    mocks.latestSnapshotAt = new Date().toISOString();
});

describe('configured health coverage', () => {
    it('reports fresh, complete coverage as healthy', async () => {
        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.status).toBe('ok');
        expect(body.database).toMatchObject({
            configured: true,
            trackedVaults: 2,
            recordedSnapshots: 2,
            coveragePercent: 100,
            latestSnapshotBlock: 100,
        });
    });

    it('degrades when the latest snapshot date misses an active vault', async () => {
        mocks.coveredVaultIds = ['vault-1', 'inactive-vault'];

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body.status).toBe('degraded');
        expect(body.database).toMatchObject({
            trackedVaults: 2,
            recordedSnapshots: 1,
            coveragePercent: 50,
        });
    });

    it('degrades stale snapshots even when coverage is complete', async () => {
        mocks.latestSnapshotAt = new Date(Date.now() - 37 * 3_600_000).toISOString();

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body.status).toBe('degraded');
        expect(body.database.ageHours).toBeGreaterThan(36);
    });
});
