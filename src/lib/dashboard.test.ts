import { describe, expect, it } from 'vitest';
import { analyzeSnapshotSeries, buildDashboardData, type SnapshotRow } from '@/lib/dashboard';

const snapshot = (
    recordedAt: string,
    pps: number,
    targetApy: number | null = 0.1,
): SnapshotRow => ({
    vault_id: 'vault-1',
    price_per_share: pps,
    target_apy: targetApy,
    tvl: 1_000,
    recorded_at: recordedAt,
    block_number: 1,
    block_hash: '0xabc',
    contract_address: '0xvault',
    provider_label: 'test-rpc',
    validation_status: 'valid',
});

describe('drift analysis', () => {
    it('compounds interval-matched expected APY and flags underperformance', () => {
        const snapshots = [
            snapshot('2026-01-01T00:00:00.000Z', 1),
            snapshot('2026-01-05T00:00:00.000Z', 1),
            snapshot('2026-01-09T00:00:00.000Z', 1),
        ];
        const analysis = analyzeSnapshotSeries(snapshots);

        expect(analysis).not.toBeNull();
        expect(analysis?.measurementDays).toBe(8);
        expect(analysis?.driftPercent).toBeCloseTo(-100, 8);

        const result = buildDashboardData(
            [{
                id: 'vault-1',
                name: 'Vault One',
                chain: 'base',
                target_apy: 0.1,
                tvl: 1_000,
                updated_at: '2026-01-09T00:00:00.000Z',
            }],
            snapshots,
        );

        expect(result.quality).toBe('ready');
        expect(result.flaggedVaults).toHaveLength(1);
        expect(result.flaggedVaults[0].driftPercent).toBeCloseTo(-100, 8);
        expect(result.analysisCoveragePercent).toBe(100);
        expect(result.latestSnapshotCoveragePercent).toBe(100);
        expect(result.analyzedTvl).toBe(1_000);
        expect(result.underperformingTvl).toBe(1_000);
        expect(result.portfolioExpectedApy).toBeCloseTo(0.1, 8);
        expect(result.portfolioActualApy).toBeCloseTo(0, 8);
        expect(result.annualizedYieldGapUsd).toBeCloseTo(100, 8);
        expect(result.flaggedVaults[0].annualizedYieldGapUsd).toBeCloseTo(100, 8);
        expect(result.uniqueObservationDays).toBe(3);
        expect(result.collectionDays).toBe(8);
        expect(result.estimatedReadyAt).toBe('2026-01-08T00:00:00.000Z');
        expect(result.portfolioVaults).toEqual([
            expect.objectContaining({
                id: 'vault-1',
                observations: 3,
                measurementDays: 8,
                status: 'review',
            }),
        ]);
        expect(result.portfolioVaults[0].driftPercent).toBeCloseTo(-100, 8);
        expect(result.driftPoints.at(-1)?.target).toBeCloseTo(0.2091, 3);
        expect(result.driftPoints.at(-1)?.actual).toBe(0);
    });

    it('does not analyze short or incomplete histories', () => {
        expect(analyzeSnapshotSeries([
            snapshot('2026-01-01T00:00:00.000Z', 1),
            snapshot('2026-01-02T00:00:00.000Z', 1.001),
        ])).toBeNull();

        expect(analyzeSnapshotSeries([
            snapshot('2026-01-01T00:00:00.000Z', 1, null),
            snapshot('2026-01-05T00:00:00.000Z', 1.001, null),
            snapshot('2026-01-09T00:00:00.000Z', 1.002, null),
        ])).toBeNull();
    });
});
