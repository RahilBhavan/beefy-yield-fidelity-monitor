// Pure interval-matched drift analysis. Kept free of database clients so the
// dashboard (server) and the calculator (browser) run the same arithmetic.

export const MINIMUM_ANALYSIS_DAYS = 7;
export const MINIMUM_OBSERVATIONS = 3;
// APYs above 1,000% are treated as upstream anomalies, not yield evidence.
export const MAX_ANALYSIS_APY = 10;

export interface SnapshotRow {
    vault_id: string;
    price_per_share: number | string;
    target_apy: number | string | null;
    tvl: number | string | null;
    recorded_at: string;
    block_number: number | string | null;
    block_hash: string | null;
    contract_address: string | null;
    provider_label: string | null;
    validation_status: string | null;
}

export interface DriftPoint {
    label: string;
    recordedAt: string;
    target: number;
    actual: number;
}

export type AnalysisConfidence = 'low' | 'medium' | 'high';

export interface VaultAnalysis {
    actualApy: number;
    expectedApy: number;
    driftPercent: number;
    observations: number;
    measurementDays: number;
    confidence: AnalysisConfidence;
    points: DriftPoint[];
    /** Start of the first interval that entered the analysis. */
    windowStart: string;
    /** End of the last interval that entered the analysis. */
    windowEnd: string;
}

function confidenceFor(days: number, observations: number): AnalysisConfidence {
    if (days >= 30 && observations >= 20) return 'high';
    if (days >= 14 && observations >= 7) return 'medium';
    return 'low';
}

function validSnapshotsInOrder(rows: SnapshotRow[]): SnapshotRow[] {
    return rows
        .filter((row) => row.validation_status === 'valid')
        .sort((a, b) => Date.parse(a.recorded_at) - Date.parse(b.recorded_at));
}

export function analyzeSnapshotSeries(rows: SnapshotRow[]): VaultAnalysis | null {
    const snapshots = validSnapshotsInOrder(rows);
    if (snapshots.length < MINIMUM_OBSERVATIONS) return null;

    let actualLogReturn = 0;
    let expectedLogReturn = 0;
    let measurementDays = 0;
    let windowStart: string | null = null;
    let windowEnd: string | null = null;
    const points: DriftPoint[] = [];

    for (let index = 1; index < snapshots.length; index += 1) {
        const previous = snapshots[index - 1];
        const current = snapshots[index];
        const previousPps = Number(previous.price_per_share);
        const currentPps = Number(current.price_per_share);
        const targetApy = Number(previous.target_apy);
        const intervalDays = (Date.parse(current.recorded_at) - Date.parse(previous.recorded_at)) / 86_400_000;

        if (
            previousPps <= 0
            || currentPps <= 0
            || previous.target_apy === null
            || !Number.isFinite(targetApy)
            || targetApy <= -1
            || targetApy > MAX_ANALYSIS_APY
            || intervalDays <= 0
        ) continue;

        actualLogReturn += Math.log(currentPps / previousPps);
        expectedLogReturn += Math.log1p(targetApy) * intervalDays / 365;
        measurementDays += intervalDays;
        windowStart ??= previous.recorded_at;
        windowEnd = current.recorded_at;

        points.push({
            label: new Date(current.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            recordedAt: current.recorded_at,
            target: Math.expm1(expectedLogReturn) * 100,
            actual: Math.expm1(actualLogReturn) * 100,
        });
    }

    if (
        measurementDays < MINIMUM_ANALYSIS_DAYS
        || points.length < MINIMUM_OBSERVATIONS - 1
        || windowStart === null
        || windowEnd === null
    ) {
        return null;
    }

    const actualReturn = Math.expm1(actualLogReturn);
    const expectedReturn = Math.expm1(expectedLogReturn);
    // Near-zero expected return turns drift into a ratio of PPS noise, so it is as meaningless as a negative one.
    if (!Number.isFinite(actualReturn) || !Number.isFinite(expectedReturn) || expectedReturn < 1e-6) {
        return null;
    }

    const actualApy = Math.expm1(actualLogReturn * 365 / measurementDays);
    const expectedApy = Math.expm1(expectedLogReturn * 365 / measurementDays);
    return {
        actualApy,
        expectedApy,
        driftPercent: ((actualReturn - expectedReturn) / expectedReturn) * 100,
        observations: snapshots.length,
        measurementDays,
        confidence: confidenceFor(measurementDays, snapshots.length),
        points,
        windowStart,
        windowEnd,
    };
}

export type HistoricalRates =
    | {
        status: 'ready';
        /** Annualized share-price growth over the window. */
        realizedApy: number;
        /** Annualized APY recorded at the start of each interval, over the same window. */
        expectedApy: number;
        windowStart: string;
        windowEnd: string;
        measurementDays: number;
        observations: number;
    }
    | {
        status: 'insufficient';
        reason: string;
        observations: number;
    };

/**
 * Summarizes a vault's snapshot history as rates the break-even calculator can use,
 * or explains why the history cannot support them yet.
 */
export function describeHistoricalRates(rows: SnapshotRow[]): HistoricalRates {
    const snapshots = validSnapshotsInOrder(rows);
    const analysis = analyzeSnapshotSeries(snapshots);
    if (analysis) {
        return {
            status: 'ready',
            realizedApy: analysis.actualApy,
            expectedApy: analysis.expectedApy,
            windowStart: analysis.windowStart,
            windowEnd: analysis.windowEnd,
            measurementDays: analysis.measurementDays,
            observations: analysis.observations,
        };
    }

    const observations = snapshots.length;
    if (observations < MINIMUM_OBSERVATIONS) {
        return {
            status: 'insufficient',
            reason: `Needs ${MINIMUM_OBSERVATIONS} valid snapshots; ${observations} recorded.`,
            observations,
        };
    }

    const spanDays = (Date.parse(snapshots[observations - 1].recorded_at) - Date.parse(snapshots[0].recorded_at)) / 86_400_000;
    if (spanDays < MINIMUM_ANALYSIS_DAYS) {
        return {
            status: 'insufficient',
            reason: `Needs ${MINIMUM_ANALYSIS_DAYS} days of snapshots; ${spanDays.toFixed(1)} recorded.`,
            observations,
        };
    }

    return {
        status: 'insufficient',
        reason: 'Recorded history has too few usable intervals to measure growth.',
        observations,
    };
}
