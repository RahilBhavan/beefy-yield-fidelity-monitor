import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_SOURCE = 'https://yield.rahilbhavan.com/api/summary';

const NUMBER_FIELDS = [
    'capitalAnalyzedUsd',
    'vaultsRequiringReview',
    'annualizedGapUsd',
    'trackedVaults',
    'readyVaults',
    'expectedApy',
    'realizedApy',
];

/** Validate an /api/summary payload and shape it as a snapshot record. */
export function toSnapshot(summary, { source, capturedAt }) {
    if (!summary || typeof summary !== 'object') throw new Error('Summary is not an object');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(summary.asOf ?? '')) throw new Error('Summary has no asOf date');
    if (summary.quality !== 'ready') {
        throw new Error(`Refusing to archive: analysis quality is "${summary.quality}", not "ready"`);
    }
    for (const field of NUMBER_FIELDS) {
        if (!Number.isFinite(summary[field])) throw new Error(`Summary field ${field} is not a finite number`);
    }
    return {
        schemaVersion: 1,
        snapshotDate: summary.asOf,
        recordedAt: summary.recordedAt,
        blockNumber: summary.blockNumber ?? null,
        capturedAt,
        source,
        method: summary.method,
        figures: Object.fromEntries(NUMBER_FIELDS.map((field) => [field, summary[field]])),
    };
}

/** Replace the entry for the snapshot's date and keep the index newest first. */
export function upsertIndex(entries, snapshot) {
    const entry = {
        snapshotDate: snapshot.snapshotDate,
        file: `${snapshot.snapshotDate}.json`,
        capitalAnalyzedUsd: snapshot.figures.capitalAnalyzedUsd,
        vaultsRequiringReview: snapshot.figures.vaultsRequiringReview,
        annualizedGapUsd: snapshot.figures.annualizedGapUsd,
        trackedVaults: snapshot.figures.trackedVaults,
    };
    return [...entries.filter((e) => e.snapshotDate !== entry.snapshotDate), entry]
        .sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate));
}

async function readIndex(file) {
    try {
        return JSON.parse(await readFile(file, 'utf8')).snapshots ?? [];
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

/** Write snapshots/<date>.json and update snapshots/index.json. Re-running for a date overwrites it. */
export async function writeSnapshot(snapshot, directory) {
    await mkdir(directory, { recursive: true });
    const snapshotFile = path.join(directory, `${snapshot.snapshotDate}.json`);
    const indexFile = path.join(directory, 'index.json');
    await writeFile(snapshotFile, `${JSON.stringify(snapshot, null, 2)}\n`);
    const snapshots = upsertIndex(await readIndex(indexFile), snapshot);
    await writeFile(indexFile, `${JSON.stringify({ snapshots }, null, 2)}\n`);
    return { snapshotFile, indexFile };
}

export async function fetchSummary(source, fetchImpl = fetch) {
    const response = await fetchImpl(source, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`${source} returned HTTP ${response.status}`);
    return response.json();
}

async function main() {
    const source = process.argv[2] ?? DEFAULT_SOURCE;
    const directory = process.env.SNAPSHOT_DIR ?? path.join(import.meta.dirname, '..', 'snapshots');
    const summary = await fetchSummary(source);
    const snapshot = toSnapshot(summary, { source, capturedAt: new Date().toISOString() });
    const { snapshotFile } = await writeSnapshot(snapshot, directory);
    console.log(`Wrote ${snapshotFile}`);
    console.log(JSON.stringify(snapshot.figures, null, 2));
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
