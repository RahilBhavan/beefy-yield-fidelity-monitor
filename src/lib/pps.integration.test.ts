import { describe, expect, it } from 'vitest';
import { getBaseVaultMarketData } from '@/lib/beefy';
import { readBasePricePerShares } from '@/lib/pps';

describe.runIf(process.env.RUN_INTEGRATION_TESTS === '1')('Base PPS integration', () => {
    it('reads positive PPS values at one identifiable block', async () => {
        const { vaults } = await getBaseVaultMarketData(3, { fresh: true });
        const batch = await readBasePricePerShares(vaults);

        expect(batch.blockNumber).toBeGreaterThan(0);
        expect(batch.blockHash).toMatch(/^0x[0-9a-f]{64}$/i);
        expect(batch.snapshots).toHaveLength(3);
        expect(batch.failures).toHaveLength(0);
        expect(batch.snapshots.every((snapshot) => Number(snapshot.pricePerShare) > 0)).toBe(true);
        expect(batch.snapshots.every((snapshot) => BigInt(snapshot.rawPricePerShare) > BigInt(0))).toBe(true);
    }, 30_000);
});
