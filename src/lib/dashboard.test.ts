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

    it('keeps portfolio aggregates finite when vault rows carry malformed numbers', () => {
        const result = buildDashboardData(
            [
                {
                    id: 'vault-1',
                    name: 'Vault One',
                    chain: 'base',
                    target_apy: 'not-a-number',
                    tvl: 'NaN',
                    updated_at: '2026-01-09T00:00:00.000Z',
                },
                {
                    id: 'vault-2',
                    name: 'Vault Two',
                    chain: 'base',
                    target_apy: 0.2,
                    tvl: 500,
                    updated_at: '2026-01-09T00:00:00.000Z',
                },
            ],
            [],
        );

        expect(result.totalTvl).toBe(500);
        expect(result.weightedApy).toBeCloseTo(0.2, 8);
        expect(result.portfolioVaults[0].tvl).toBe(0);
        expect(result.portfolioVaults[0].currentApy).toBe(0);
    });

    it('weights configured portfolio totals across analyzed and unobserved vaults', () => {
        const vaults = [
            { id: 'vault-1', name: 'One', chain: 'base', target_apy: 0.1, tvl: 1_000, updated_at: '2026-01-09T00:00:00.000Z' },
            { id: 'vault-2', name: 'Two', chain: 'base', target_apy: 0.2, tvl: 3_000, updated_at: '2026-01-09T00:00:00.000Z' },
            { id: 'vault-3', name: 'Three', chain: 'base', target_apy: 0.1, tvl: 1_000, updated_at: '2026-01-09T00:00:00.000Z' },
        ];
        const dates = ['2026-01-01T00:00:00.000Z', '2026-01-05T00:00:00.000Z', '2026-01-09T00:00:00.000Z'];
        const observations = dates.flatMap((date) => [
            snapshot(date, 1, 0.1),
            { ...snapshot(date, 1, 0.2), vault_id: 'vault-2' },
        ]);

        const result = buildDashboardData(vaults, observations);

        expect(result.trackedVaults).toBe(3);
        expect(result.readyVaults).toBe(2);
        expect(result.totalTvl).toBe(5_000);
        expect(result.weightedApy).toBeCloseTo(0.16, 8);
        expect(result.analyzedTvl).toBe(4_000);
        expect(result.underperformingTvl).toBe(4_000);
        expect(result.portfolioExpectedApy).toBeCloseTo(0.175, 8);
        expect(result.portfolioActualApy).toBe(0);
        expect(result.annualizedYieldGapUsd).toBeCloseTo(700, 8);
        expect(result.analysisCoveragePercent).toBeCloseTo(200 / 3, 8);
        expect(result.latestSnapshotCoveragePercent).toBeCloseTo(200 / 3, 8);
        expect(result.portfolioVaults.find((vault) => vault.id === 'vault-3')?.status).toBe('no-data');
    });

    it('excludes intervals touching non-positive PPS observations', () => {
        const analysis = analyzeSnapshotSeries([
            snapshot('2026-01-01T00:00:00.000Z', 1),
            snapshot('2026-01-05T00:00:00.000Z', 0),
            snapshot('2026-01-09T00:00:00.000Z', 1),
            snapshot('2026-01-17T00:00:00.000Z', 1),
            snapshot('2026-01-25T00:00:00.000Z', 1),
        ]);

        expect(analysis).not.toBeNull();
        expect(analysis?.measurementDays).toBe(16);
        expect(analysis?.points).toHaveLength(2);
    });

    it('reports block number 0 as 0, not null', () => {
        const result = buildDashboardData(
            [{
                id: 'vault-1',
                name: 'Vault One',
                chain: 'base',
                target_apy: 0.1,
                tvl: 1_000,
                updated_at: '2026-01-09T00:00:00.000Z',
            }],
            [
                { ...snapshot('2026-01-01T00:00:00.000Z', 1), block_number: '0' },
                { ...snapshot('2026-01-05T00:00:00.000Z', 1), block_number: '0' },
                { ...snapshot('2026-01-09T00:00:00.000Z', 1), block_number: 0 },
            ],
        );

        expect(result.latestBlockNumber).toBe(0);
        expect(result.portfolioVaults[0].blockNumber).toBe(0);
        expect(result.flaggedVaults[0].blockNumber).toBe(0);
    });

    it('excludes drift when the expected return is vanishingly small', () => {
        expect(analyzeSnapshotSeries([
            snapshot('2026-01-01T00:00:00.000Z', 1, 1e-9),
            snapshot('2026-01-05T00:00:00.000Z', 1.001, 1e-9),
            snapshot('2026-01-09T00:00:00.000Z', 1.002, 1e-9),
        ])).toBeNull();
    });

    it('excludes anomalous upstream APY intervals from annualized performance', () => {
        const analysis = analyzeSnapshotSeries([
            snapshot('2026-01-01T00:00:00.000Z', 1, 0.1),
            snapshot('2026-01-05T00:00:00.000Z', 1.001, 1e35),
            snapshot('2026-01-09T00:00:00.000Z', 1.002, 0.1),
            snapshot('2026-01-13T00:00:00.000Z', 1.003, 0.1),
        ]);

        expect(analysis?.measurementDays).toBe(8);
        expect(analysis?.expectedApy).toBeCloseTo(0.1, 8);
        expect(analysis?.points).toHaveLength(2);
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
