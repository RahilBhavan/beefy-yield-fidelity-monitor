import { describe, expect, it } from 'vitest';
import { buildRateOptions, resolveRateOption } from '@/lib/rateBasis';
import { calculateBreakEven } from '@/lib/yield';

const readyHistory = {
    status: 'ready' as const,
    realizedApy: 0.0577,
    expectedApy: 0.2233,
    windowStart: '2026-08-11T20:51:54.639Z',
    windowEnd: '2026-10-16T01:33:00.000Z',
    measurementDays: 65.2,
    observations: 66,
};

describe('rate options', () => {
    it('offers headline, interval-matched expected and realized rates when history is ready', () => {
        const options = buildRateOptions(0.8825, readyHistory);

        expect(options.map(({ basis, apy, disabledReason }) => ({ basis, apy, disabledReason }))).toEqual([
            { basis: 'headline', apy: 0.8825, disabledReason: null },
            { basis: 'expected', apy: 0.2233, disabledReason: null },
            { basis: 'realized', apy: 0.0577, disabledReason: null },
        ]);
    });

    it('disables historical rates with the history reason', () => {
        const options = buildRateOptions(0.12, {
            status: 'insufficient',
            reason: 'Needs 3 valid snapshots; 1 recorded.',
            observations: 1,
        });

        expect(options[0].disabledReason).toBeNull();
        expect(options.slice(1).map((option) => [option.apy, option.disabledReason])).toEqual([
            [null, 'Needs 3 valid snapshots; 1 recorded.'],
            [null, 'Needs 3 valid snapshots; 1 recorded.'],
        ]);
    });

    it('disables historical rates while history loads or is unavailable', () => {
        expect(buildRateOptions(0.12, { status: 'loading' })[2].disabledReason).toBe('Loading snapshot history…');
        expect(buildRateOptions(0.12, { status: 'unavailable', reason: 'Not configured.' })[2].disabledReason)
            .toBe('Not configured.');
    });

    it('falls back to the headline rate when the requested rate is disabled', () => {
        const disabled = buildRateOptions(0.12, { status: 'loading' });
        expect(resolveRateOption('realized', disabled).basis).toBe('headline');
        expect(resolveRateOption('realized', buildRateOptions(0.12, readyHistory)).basis).toBe('realized');
    });

    it('changes break-even days when the selected rate changes', () => {
        const options = buildRateOptions(0.8825, readyHistory);
        const daysFor = (basis: 'headline' | 'expected' | 'realized') => calculateBreakEven(
            10,
            resolveRateOption(basis, options).apy ?? 0,
            0.0074,
            0.0074,
        ).breakEvenDays;

        expect(daysFor('headline')).toBe(1);
        expect(daysFor('expected')).toBe(3);
        expect(daysFor('realized')).toBe(10);
    });
});
