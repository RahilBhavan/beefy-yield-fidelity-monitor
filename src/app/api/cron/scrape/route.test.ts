import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/cron/scrape/route';
import { getBaseVaultMarketData } from '@/lib/beefy';
import { readBasePricePerShares } from '@/lib/pps';
import { createSupabaseAdmin } from '@/lib/supabase';

vi.mock('@/lib/beefy', () => ({ getBaseVaultMarketData: vi.fn() }));
vi.mock('@/lib/pps', () => ({ readBasePricePerShares: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ createSupabaseAdmin: vi.fn() }));

const originalCronSecret = process.env.CRON_SECRET;

afterEach(() => {
    vi.restoreAllMocks();
    if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCronSecret;
});

function authorizedRequest() {
    return new Request('http://localhost/api/cron/scrape', {
        headers: { authorization: 'Bearer expected' },
    });
}

describe('PPS scraper authentication', () => {
    it('fails closed when CRON_SECRET is missing', async () => {
        delete process.env.CRON_SECRET;
        const response = await GET(new Request('http://localhost/api/cron/scrape'));
        expect(response.status).toBe(401);
    });

    it('rejects an incorrect bearer token', async () => {
        process.env.CRON_SECRET = 'expected';
        const response = await GET(new Request('http://localhost/api/cron/scrape', {
            headers: { authorization: 'Bearer incorrect' },
        }));
        expect(response.status).toBe(401);
    });
});

describe('PPS scraper coverage', () => {
    it('marks a partial ingest failed and allows a later retry to complete', async () => {
        process.env.CRON_SECRET = 'expected';
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const vaults = Array.from({ length: 20 }, (_, index) => ({
            id: `vault-${index}`,
            name: `Vault ${index}`,
            chain: 'base' as const,
            earnContractAddress: `0x${String(index + 1).padStart(40, '0')}`,
            tokenAddress: null,
            token: null,
            tvl: 1000,
            apy: 0.1,
            performanceFee: 0,
        }));
        vi.mocked(getBaseVaultMarketData).mockResolvedValue({ vaults, ethPriceUsd: 2000, fetchedAt: new Date().toISOString() });
        const makeBatch = (count: number) => ({
            blockNumber: 123,
            blockHash: '0xabc',
            providerLabel: 'test',
            snapshots: vaults.slice(0, count).map((vault) => ({
                vaultId: vault.id,
                contractAddress: vault.earnContractAddress,
                pricePerShare: '1.01',
                rawPricePerShare: '1010000000000000000',
                decimals: 18,
            })),
            failures: vaults.slice(count).map((vault) => ({
                vaultId: vault.id,
                contractAddress: vault.earnContractAddress,
                reason: 'PPS call reverted',
            })),
        });
        vi.mocked(readBasePricePerShares)
            .mockResolvedValueOnce(makeBatch(18))
            .mockResolvedValueOnce(makeBatch(19));
        const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
        const rpc = vi.fn().mockImplementation(async (name: string, args?: { p_snapshots?: unknown[] }) => {
            if (name === 'begin_scrape_run') {
                return { data: [{ run_id: 'test-run', claimed: true, existing_status: 'running' }], error: null };
            }
            if (name === 'ingest_vault_snapshots') {
                return { data: args?.p_snapshots?.length, error: null };
            }
            throw new Error(`Unexpected RPC ${name}`);
        });
        vi.mocked(createSupabaseAdmin).mockReturnValue({ rpc, from: vi.fn().mockReturnValue({ update }) } as unknown as ReturnType<typeof createSupabaseAdmin>);

        const partial = await GET(authorizedRequest());
        expect(partial.status).toBe(500);
        await expect(partial.json()).resolves.toMatchObject({ error: 'Snapshot coverage below 95%: 18 of 20 vaults recorded' });
        expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));

        const retry = await GET(authorizedRequest());
        expect(retry.status).toBe(200);
        await expect(retry.json()).resolves.toMatchObject({ recordedSnapshots: 19, trackedVaults: 20 });
        expect(rpc).toHaveBeenCalledTimes(4);
    });
});
