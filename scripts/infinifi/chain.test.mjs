import { describe, expect, it } from 'vitest';
import { ChainReader, mapLimit } from './chain.mjs';

const reader = (answers) => new ChainReader(Object.keys(answers), (url) => ({ url }));
const answer = (answers) => async (provider) => {
    const value = answers[provider.url];
    if (value instanceof Error) throw value;
    return value;
};

describe('ChainReader.consensus', () => {
    it('returns a value two providers agree on and records who agreed', async () => {
        const answers = { a: '0x01', b: '0x01', c: '0x02' };
        const chain = reader(answers);
        await expect(chain.consensus(answer(answers))).resolves.toBe('0x01');
        expect([...chain.used]).toEqual(['a', 'b']);
    });

    it('skips a provider that errors and still finds two that agree', async () => {
        const answers = { a: new Error('down'), b: '0x07', c: '0x07' };
        await expect(reader(answers).consensus(answer(answers))).resolves.toBe('0x07');
    });

    it('throws when providers disagree and no two match', async () => {
        const answers = { a: '0x01', b: '0x02', c: '0x03' };
        await expect(reader(answers).consensus(answer(answers))).rejects.toThrow(/disagree/);
    });

    it('throws when fewer than two providers answer', async () => {
        const answers = { a: '0x01', b: new Error('down'), c: new Error('down') };
        await expect(reader(answers).consensus(answer(answers))).rejects.toThrow(/fewer than two/);
    });
});

describe('mapLimit', () => {
    it('keeps input order and never runs more than the limit at once', async () => {
        let running = 0;
        let peak = 0;
        const results = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (value) => {
            running += 1;
            peak = Math.max(peak, running);
            await new Promise((resolve) => setTimeout(resolve, 5));
            running -= 1;
            return value * 10;
        });
        expect(results).toEqual([10, 20, 30, 40, 50, 60]);
        expect(peak).toBeLessThanOrEqual(2);
    });
});
