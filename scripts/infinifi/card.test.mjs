import { describe, expect, it } from 'vitest';
import { buildCardHtml, cardText } from './card.mjs';

const report = {
    endBlock: { number: 26_277_123, timestamp: 1_793_020_859 },
    siUSD: {
        windows: {
            30: { startBlock: 26_061_889, startTimestamp: 1_790_428_859, realizedApy: 0.063662, advertisedApy: 0.064068, gapPoints: -0.040584 },
        },
    },
    locked: [
        { evaluated: true, windows: { 30: { gapPoints: -0.0140 } } },
        { evaluated: true, windows: { 30: { gapPoints: -0.0303 } } },
        { evaluated: false, windows: {} },
    ],
    reserves: { readable: true, block: 26_277_123, reserveRatio: 0.154204, liquidReserves: 10_680_187.16, totalDeposits: 69_260_083.53 },
};
const fonts = { display: 'AAAA', body: 'BBBB', bodyBold: 'CCCC' };

describe('cardText', () => {
    it('states the measured numbers, window and blocks exactly as the report holds them', () => {
        const text = cardText(report);
        expect(text.title).toBe('siUSD earned 6.37% vs 6.41% published');
        expect(text.gap).toBe('−0.04 pts');
        expect(text.reserve).toBe('15.4%');
        expect(text.reserveDetail).toBe('$10.68M of $69.26M');
        expect(text.lockedNote).toBe('2 liUSD buckets: gaps −0.01 to −0.03 pts');
        expect(text.footer.join(' ')).toContain('26,061,889 to 26,277,123');
        expect(text.footer.join(' ')).toContain('26 Oct 2026, 13:20 UTC');
    });

    it('refuses to draw a number the report does not hold', () => {
        const withoutAdvertised = structuredClone(report);
        withoutAdvertised.siUSD.windows[30].advertisedApy = null;
        expect(() => cardText(withoutAdvertised)).toThrow(/does not estimate/);

        const withoutReserve = structuredClone(report);
        withoutReserve.reserves = { readable: false };
        expect(() => cardText(withoutReserve)).toThrow(/reserve ratio/);
    });
});

describe('buildCardHtml', () => {
    it('is a 1080px square that draws only token colours and embeds its fonts', () => {
        const html = buildCardHtml(report, fonts);
        expect(html).toContain('width:1080px;height:1080px');
        expect(html).toContain('base64,AAAA');
        const colours = new Set(html.match(/#[0-9A-Fa-f]{6}/g).map((value) => value.toUpperCase()));
        const tokens = ['#111214', '#F5F5EF', '#B7B8B1', '#52545A', '#76787D', '#FFE500'];
        expect([...colours].filter((value) => !tokens.includes(value))).toEqual([]);
    });
});
