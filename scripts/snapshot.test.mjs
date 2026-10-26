import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fetchSummary, toSnapshot, upsertIndex, writeSnapshot } from './snapshot.mjs';

const summary = {
    asOf: '2026-10-25',
    recordedAt: '2026-10-25T01:33:42.413+00:00',
    blockNumber: 53051337,
    quality: 'ready',
    capitalAnalyzedUsd: 3_200_000,
    vaultsRequiringReview: 3,
    annualizedGapUsd: 91_800,
    trackedVaults: 26,
    readyVaults: 9,
    expectedApy: 0.1152,
    realizedApy: 0.0862,
    method: 'dashboard-computation',
};
const context = { source: 'https://example.test/api/summary', capturedAt: '2026-10-25T12:00:00.000Z' };

describe('toSnapshot', () => {
    it('keeps the headline figures and dates the snapshot by its data date', () => {
        const snapshot = toSnapshot(summary, context);
        expect(snapshot.snapshotDate).toBe('2026-10-25');
        expect(snapshot.capturedAt).toBe(context.capturedAt);
        expect(snapshot.figures).toMatchObject({
            capitalAnalyzedUsd: 3_200_000,
            vaultsRequiringReview: 3,
            annualizedGapUsd: 91_800,
            trackedVaults: 26,
        });
    });

    it('refuses a summary that is not ready or has a bad figure', () => {
        expect(() => toSnapshot({ ...summary, quality: 'collecting' }, context)).toThrow(/not "ready"/);
        expect(() => toSnapshot({ ...summary, annualizedGapUsd: null }, context)).toThrow(/annualizedGapUsd/);
        expect(() => toSnapshot({ ...summary, asOf: undefined }, context)).toThrow(/asOf/);
    });
});

describe('writeSnapshot', () => {
    it('writes the file and index, and a rerun for the same date replaces the entry', async () => {
        const directory = await mkdtemp(path.join(os.tmpdir(), 'snapshots-'));
        await writeSnapshot(toSnapshot(summary, context), directory);
        await writeSnapshot(toSnapshot({ ...summary, asOf: '2026-10-26' }, context), directory);
        await writeSnapshot(toSnapshot({ ...summary, vaultsRequiringReview: 4 }, context), directory);

        const index = JSON.parse(await readFile(path.join(directory, 'index.json'), 'utf8'));
        expect(index.snapshots.map((e) => e.snapshotDate)).toEqual(['2026-10-26', '2026-10-25']);
        expect(index.snapshots[1].vaultsRequiringReview).toBe(4);
        const file = JSON.parse(await readFile(path.join(directory, '2026-10-25.json'), 'utf8'));
        expect(file.figures.vaultsRequiringReview).toBe(4);
    });
});

describe('upsertIndex', () => {
    it('sorts newest first', () => {
        const older = toSnapshot({ ...summary, asOf: '2026-10-20' }, context);
        const newer = toSnapshot(summary, context);
        const entries = upsertIndex(upsertIndex([], older), newer);
        expect(entries.map((e) => e.snapshotDate)).toEqual(['2026-10-25', '2026-10-20']);
    });
});

describe('fetchSummary', () => {
    it('throws on a non-200 response', async () => {
        const failing = async () => new Response('{}', { status: 503 });
        await expect(fetchSummary('https://example.test', failing)).rejects.toThrow(/HTTP 503/);
    });
});
