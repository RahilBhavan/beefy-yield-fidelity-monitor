import { describe, expect, it } from 'vitest';
import { buildDashboardData } from '@/lib/dashboard';
import { buildHeadlineSummary } from '@/lib/summary';

describe('buildHeadlineSummary', () => {
    it('returns null without recorded snapshots', () => {
        expect(buildHeadlineSummary(buildDashboardData([], []))).toBeNull();
    });

    it('dates the figures by the latest snapshot and matches the dashboard data', () => {
        const vaults = [{ id: 'v1', name: 'V1', chain: 'base', target_apy: 0.1, tvl: 1000, updated_at: '2026-10-25T00:00:00Z' }];
        const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((day) => ({
            vault_id: 'v1',
            price_per_share: 1 + day * 0.00001,
            target_apy: 0.1,
            tvl: 1000,
            recorded_at: `2026-10-${String(17 + day).padStart(2, '0')}T01:00:00.000Z`,
            block_number: 100 + day,
            block_hash: '0xabc',
            contract_address: '0x1',
            provider_label: 'test',
            validation_status: 'valid',
        }));
        const data = buildDashboardData(vaults, rows);
        const summary = buildHeadlineSummary(data);
        expect(summary).toMatchObject({
            asOf: '2026-10-25',
            quality: 'ready',
            trackedVaults: 1,
            capitalAnalyzedUsd: data.analyzedTvl,
            annualizedGapUsd: data.annualizedYieldGapUsd,
            vaultsRequiringReview: data.flaggedVaults.length,
        });
    });
});
