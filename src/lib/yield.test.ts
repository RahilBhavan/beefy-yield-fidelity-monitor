import { describe, expect, it } from 'vitest';
import { calculateBreakEven, dailyRateFromApy } from '@/lib/yield';

describe('yield calculations', () => {
    it('converts APY to an effective daily rate', () => {
        const dailyRate = dailyRateFromApy(0.1);
        expect(Math.pow(1 + dailyRate, 365) - 1).toBeCloseTo(0.1, 10);
    });

    it('returns a rounded-up break-even day', () => {
        const result = calculateBreakEven(1_000, 0.1, 0.5, 0.5);
        expect(result.totalGasCostUsd).toBe(1);
        expect(result.breakEvenDays).toBe(4);
    });

    it('does not claim break-even for zero yield', () => {
        expect(calculateBreakEven(1_000, 0, 0.5, 0.5).breakEvenDays).toBeNull();
    });
});
