import { describe, expect, it } from 'vitest';
import { analyzeSnapshotSeries } from '../../src/lib/drift';
import {
    compareWindow,
    dailyApyDeviation,
    realizedApy,
    reserveRatios,
    toNumber,
    worstWeeklyFall,
} from './fidelity.mjs';

const DAY = 86_400;

describe('realizedApy', () => {
    it('annualises the log-return the way drift.ts does', () => {
        expect(realizedApy(1, 1.01, 30)).toBeCloseTo(Math.expm1(Math.log(1.01) * 365 / 30), 12);
        expect(realizedApy(1, 1, 30)).toBe(0);
    });

    it('refuses a missing or non-positive input instead of guessing', () => {
        expect(realizedApy(0, 1, 30)).toBeNull();
        expect(realizedApy(1, 1.01, 0)).toBeNull();
        expect(realizedApy(1, undefined, 30)).toBeNull();
    });
});

describe('compareWindow', () => {
    it('matches analyzeSnapshotSeries when the advertised APY is flat across the window', () => {
        const start = Date.parse('2026-09-26T00:00:00Z');
        const days = 30;
        const advertised = 0.0640;
        const rates = [1.0, 1.0035, 1.0051];
        const rows = rates.map((rate, index) => ({
            vault_id: 'x',
            price_per_share: rate,
            target_apy: advertised,
            tvl: null,
            recorded_at: new Date(start + [0, 10, 30][index] * 86_400_000).toISOString(),
            block_number: null,
            block_hash: null,
            contract_address: null,
            provider_label: null,
            validation_status: 'valid',
        }));
        const reference = analyzeSnapshotSeries(rows);
        const mine = compareWindow({ startRate: rates[0], endRate: rates[2], days, advertisedApy: advertised });

        expect(mine.realizedApy).toBeCloseTo(reference.actualApy, 10);
        expect(mine.advertisedApy).toBeCloseTo(reference.expectedApy, 10);
        expect(mine.driftPercent).toBeCloseTo(reference.driftPercent, 8);
    });

    it('reports the gap in percentage points, negative when realised growth is lower', () => {
        const result = compareWindow({ startRate: 1, endRate: 1 + 0.06 * 30 / 365, days: 30, advertisedApy: 0.07 });
        expect(result.gapPoints).toBeLessThan(0);
        expect(result.driftPercent).toBeLessThan(0);
    });

    it('keeps the realised figure but leaves the gap empty when nothing was advertised', () => {
        const result = compareWindow({ startRate: 1, endRate: 1.01, days: 30, advertisedApy: null });
        expect(result.realizedApy).toBeGreaterThan(0);
        expect(result.gapPoints).toBeNull();
        expect(result.driftPercent).toBeNull();
    });
});

describe('reserveRatios', () => {
    it('divides liquid reserves by deposits and by backing, and adds instant liquidity from maturity farms', () => {
        const ratios = reserveRatios({
            liquidReserves: 10_680_177_658_418n,
            maturityInstant: 7_542_013_293_857n - 0n,
            totalDeposits: 69_260_083_528_555n,
            totalBacking: 69_260_492_000_000n,
        });
        expect(ratios.reserveRatio).toBeCloseTo(0.15420, 4);
        expect(ratios.instantRatio).toBeCloseTo(0.26310, 4);
        expect(ratios.reserveRatioOfBacking).toBeCloseTo(0.15420, 4);
    });

    it('returns null for an empty denominator', () => {
        const ratios = reserveRatios({ liquidReserves: 1n, maturityInstant: 0n, totalDeposits: 0n, totalBacking: 0n });
        expect(ratios.reserveRatio).toBeNull();
    });
});

describe('series helpers', () => {
    it('finds the largest weekly fall and ignores gains', () => {
        expect(worstWeeklyFall([{ rate: 1 }, { rate: 1.01 }, { rate: 1.0 }, { rate: 1.02 }])).toBeCloseTo(1 / 1.01 - 1, 12);
        expect(worstWeeklyFall([{ rate: 1 }, { rate: 1.01 }])).toBe(0);
    });

    it('measures day-to-day spread of annualised growth', () => {
        const samples = [0, 1, 2, 3].map((day) => ({ timestamp: day * DAY, rate: 1 + day * 0.00017 }));
        const result = dailyApyDeviation(samples);
        expect(result.count).toBe(3);
        expect(result.standardDeviation).toBeGreaterThanOrEqual(0);
        expect(dailyApyDeviation(samples.slice(0, 2))).toBeNull();
    });

    it('converts bigints to numbers by decimals', () => {
        expect(toNumber(1_234_567n, 6)).toBeCloseTo(1.234567, 9);
        expect(toNumber(10n ** 18n, 18)).toBe(1);
    });
});
