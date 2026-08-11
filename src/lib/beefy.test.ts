import { describe, expect, it } from 'vitest';
import { selectActiveBaseVaults } from '@/lib/beefy';

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
