import { describe, expect, it } from 'vitest';
import { combineGasCosts } from '@/lib/baseGas';

describe('combineGasCosts', () => {
    it('includes L2 execution and L1 security fees for both actions', () => {
        const result = combineGasCosts(
            BigInt(1_000_000_000),
            BigInt(1_000_000_000_000),
            BigInt(2_000_000_000_000),
            2_000,
        );
        expect(result.entryCostUsd).toBeCloseTo(1.002, 6);
        expect(result.exitCostUsd).toBeCloseTo(1.004, 6);
        expect(result.estimatedCostUsd).toBeCloseTo(2.006, 6);
    });
});
