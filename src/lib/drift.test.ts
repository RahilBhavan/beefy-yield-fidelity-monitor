import { describe, expect, it } from 'vitest';
import { analyzeSnapshotSeries, describeHistoricalRates, type SnapshotRow } from '@/lib/drift';

const snapshot = (
    recordedAt: string,
    pps: number,
    targetApy: number | null = 0.1,
    validationStatus = 'valid',
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
    validation_status: validationStatus,
});

// Share price that compounds at exactly `apy` per year from 1.0 on 2026-01-01.
const compoundingSeries = (days: number[], apy: number, recordedApy: number) => days.map((day) => snapshot(
    new Date(Date.UTC(2026, 0, 1) + day * 86_400_000).toISOString(),
    Math.pow(1 + apy, day / 365),
    recordedApy,
));

describe('analysis window', () => {
    it('reports the first and last interval that entered the analysis', () => {
        const analysis = analyzeSnapshotSeries([
            snapshot('2026-01-01T00:00:00.000Z', 1, null),
            snapshot('2026-01-02T00:00:00.000Z', 1),
            snapshot('2026-01-06T00:00:00.000Z', 1.001),
            snapshot('2026-01-10T00:00:00.000Z', 1.002),
        ]);

        // The first interval has no recorded APY, so the window starts at the second snapshot.
        expect(analysis?.windowStart).toBe('2026-01-02T00:00:00.000Z');
        expect(analysis?.windowEnd).toBe('2026-01-10T00:00:00.000Z');
        expect(analysis?.measurementDays).toBe(8);
    });
});

describe('historical rates for the calculator', () => {
    it('returns realized and interval-matched expected rates over the window', () => {
        const rates = describeHistoricalRates(compoundingSeries([0, 10, 20, 30], 0.05, 0.2));

        expect(rates.status).toBe('ready');
        if (rates.status !== 'ready') return;
        expect(rates.realizedApy).toBeCloseTo(0.05, 10);
        expect(rates.expectedApy).toBeCloseTo(0.2, 10);
        expect(rates.windowStart).toBe('2026-01-01T00:00:00.000Z');
        expect(rates.windowEnd).toBe('2026-01-31T00:00:00.000Z');
        expect(rates.measurementDays).toBe(30);
        expect(rates.observations).toBe(4);
    });

    it('ignores rows that failed validation', () => {
        const rows = [
            ...compoundingSeries([0, 10, 20], 0.05, 0.05),
            snapshot('2026-01-15T00:00:00.000Z', 9, 0.05, 'invalid'),
        ];
        const rates = describeHistoricalRates(rows);

        expect(rates.status).toBe('ready');
        if (rates.status !== 'ready') return;
        expect(rates.realizedApy).toBeCloseTo(0.05, 10);
        expect(rates.observations).toBe(3);
    });

    it('explains a history with too few snapshots', () => {
        expect(describeHistoricalRates(compoundingSeries([0, 10], 0.05, 0.05))).toEqual({
            status: 'insufficient',
            reason: 'Needs 3 valid snapshots; 2 recorded.',
            observations: 2,
        });
    });

    it('explains a history that spans too few days', () => {
        expect(describeHistoricalRates(compoundingSeries([0, 1, 2], 0.05, 0.05))).toEqual({
            status: 'insufficient',
            reason: 'Needs 7 days of snapshots; 2.0 recorded.',
            observations: 3,
        });
    });

    it('explains a long history whose intervals cannot be measured', () => {
        const rows = compoundingSeries([0, 5, 10], 0.05, 0.05).map((row) => ({ ...row, target_apy: null }));
        expect(describeHistoricalRates(rows)).toMatchObject({
            status: 'insufficient',
            reason: 'Recorded history has too few usable intervals to measure growth.',
        });
    });
});
