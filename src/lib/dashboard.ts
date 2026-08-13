import { createSupabaseReader, hasSupabaseReaderConfiguration } from '@/lib/supabase';

const MINIMUM_ANALYSIS_DAYS = 7;
const MINIMUM_OBSERVATIONS = 3;

interface VaultRow {
    id: string;
    name: string;
    chain: string;
    target_apy: number | string | null;
    tvl: number | string | null;
    updated_at: string;
}

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

export interface PortfolioVault {
    id: string;
    name: string;
    tvl: number;
    currentApy: number;
    latestPps: number | null;
    observations: number;
    measurementDays: number;
    latestRecordedAt: string | null;
    blockNumber: number | null;
    status: 'review' | 'ready' | 'collecting' | 'no-data';
    driftPercent: number | null;
}

export interface FlaggedVault {
    id: string;
    name: string;
    driftPercent: number;
    tvl: number;
    apy: number;
    actualApy: number;
    annualizedYieldGapUsd: number;
    observations: number;
    measurementDays: number;
    confidence: 'low' | 'medium' | 'high';
    blockNumber: number | null;
}

export interface DashboardData {
    status: 'live' | 'unconfigured' | 'empty' | 'error';
    quality: 'ready' | 'collecting' | 'unavailable';
    message: string;
    updatedAt: string | null;
    trackedVaults: number;
    readyVaults: number;
    totalTvl: number;
    weightedApy: number;
    analyzedTvl: number;
    underperformingTvl: number;
    portfolioExpectedApy: number;
    portfolioActualApy: number;
    annualizedYieldGapUsd: number;
    analysisCoveragePercent: number;
    latestSnapshotCoveragePercent: number;
    uniqueObservationDays: number;
    collectionDays: number;
    firstSnapshotAt: string | null;
    estimatedReadyAt: string | null;
    portfolioVaults: PortfolioVault[];
    flaggedVaults: FlaggedVault[];
    chartVaultName: string | null;
    driftPoints: DriftPoint[];
    latestBlockNumber: number | null;
    latestBlockHash: string | null;
    providerLabel: string | null;
}

interface VaultAnalysis {
    actualApy: number;
    expectedApy: number;
    driftPercent: number;
    observations: number;
    measurementDays: number;
    confidence: FlaggedVault['confidence'];
    points: DriftPoint[];
}

const emptyDashboard = (
    status: DashboardData['status'],
    message: string,
): DashboardData => ({
    status,
    quality: 'unavailable',
    message,
    updatedAt: null,
    trackedVaults: 0,
    readyVaults: 0,
    totalTvl: 0,
    weightedApy: 0,
    analyzedTvl: 0,
    underperformingTvl: 0,
    portfolioExpectedApy: 0,
    portfolioActualApy: 0,
    annualizedYieldGapUsd: 0,
    analysisCoveragePercent: 0,
    latestSnapshotCoveragePercent: 0,
    uniqueObservationDays: 0,
    collectionDays: 0,
    firstSnapshotAt: null,
    estimatedReadyAt: null,
    portfolioVaults: [],
    flaggedVaults: [],
    chartVaultName: null,
    driftPoints: [],
    latestBlockNumber: null,
    latestBlockHash: null,
    providerLabel: null,
});

function confidenceFor(days: number, observations: number): FlaggedVault['confidence'] {
    if (days >= 30 && observations >= 20) return 'high';
    if (days >= 14 && observations >= 7) return 'medium';
    return 'low';
}

export function analyzeSnapshotSeries(rows: SnapshotRow[]): VaultAnalysis | null {
    const snapshots = rows
        .filter((row) => row.validation_status === 'valid')
        .sort((a, b) => Date.parse(a.recorded_at) - Date.parse(b.recorded_at));
    if (snapshots.length < MINIMUM_OBSERVATIONS) return null;

    let actualLogReturn = 0;
    let expectedLogReturn = 0;
    let measurementDays = 0;
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
            || intervalDays <= 0
        ) continue;

        actualLogReturn += Math.log(currentPps / previousPps);
        expectedLogReturn += Math.log1p(targetApy) * intervalDays / 365;
        measurementDays += intervalDays;

        points.push({
            label: new Date(current.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            recordedAt: current.recorded_at,
            target: Math.expm1(expectedLogReturn) * 100,
            actual: Math.expm1(actualLogReturn) * 100,
        });
    }

    if (measurementDays < MINIMUM_ANALYSIS_DAYS || points.length < MINIMUM_OBSERVATIONS - 1) {
        return null;
    }

    const actualReturn = Math.expm1(actualLogReturn);
    const expectedReturn = Math.expm1(expectedLogReturn);
    if (!Number.isFinite(actualReturn) || !Number.isFinite(expectedReturn) || expectedReturn <= 0) {
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
    };
}

export function buildDashboardData(
    vaultRows: VaultRow[],
    snapshotRows: SnapshotRow[],
): DashboardData {
    const snapshotsByVault = new Map<string, SnapshotRow[]>();
    for (const snapshot of snapshotRows) {
        const entries = snapshotsByVault.get(snapshot.vault_id) ?? [];
        entries.push(snapshot);
        snapshotsByVault.set(snapshot.vault_id, entries);
    }
    for (const entries of snapshotsByVault.values()) {
        entries.sort((a, b) => Date.parse(a.recorded_at) - Date.parse(b.recorded_at));
    }

    const normalizedVaults = vaultRows.map((vault) => ({
        ...vault,
        apy: Number(vault.target_apy ?? 0),
        numericTvl: Number(vault.tvl ?? 0),
        snapshots: snapshotsByVault.get(vault.id) ?? [],
    }));
    const totalTvl = normalizedVaults.reduce((sum, vault) => sum + vault.numericTvl, 0);
    const weightedApy = totalTvl > 0
        ? normalizedVaults.reduce((sum, vault) => sum + vault.apy * vault.numericTvl, 0) / totalTvl
        : 0;

    const analyzed = normalizedVaults.flatMap((vault) => {
        const analysis = analyzeSnapshotSeries(vault.snapshots);
        return analysis ? [{ vault, analysis }] : [];
    });

    const flaggedVaults = analyzed
        .filter(({ analysis }) => analysis.driftPercent <= -5)
        .map(({ vault, analysis }) => {
            const latest = vault.snapshots[vault.snapshots.length - 1];
            return {
                id: vault.id,
                name: vault.name,
                driftPercent: analysis.driftPercent,
                tvl: vault.numericTvl,
                apy: analysis.expectedApy,
                actualApy: analysis.actualApy,
                annualizedYieldGapUsd: Math.max(0, vault.numericTvl * (analysis.expectedApy - analysis.actualApy)),
                observations: analysis.observations,
                measurementDays: analysis.measurementDays,
                confidence: analysis.confidence,
                blockNumber: latest?.block_number ? Number(latest.block_number) : null,
            };
        })
        .sort((a, b) => a.driftPercent - b.driftPercent);

    const chartCandidate = [...analyzed]
        .sort((a, b) => b.vault.numericTvl - a.vault.numericTvl)[0];
    const latestSnapshot = [...snapshotRows]
        .sort((a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at))[0];
    const updatedAt = latestSnapshot?.recorded_at ?? null;
    const hasSnapshots = snapshotRows.length > 0;
    const isReady = analyzed.length > 0;
    const analyzedTvl = analyzed.reduce((sum, { vault }) => sum + vault.numericTvl, 0);
    const portfolioExpectedApy = analyzedTvl > 0
        ? analyzed.reduce((sum, { vault, analysis }) => sum + vault.numericTvl * analysis.expectedApy, 0) / analyzedTvl
        : 0;
    const portfolioActualApy = analyzedTvl > 0
        ? analyzed.reduce((sum, { vault, analysis }) => sum + vault.numericTvl * analysis.actualApy, 0) / analyzedTvl
        : 0;
    const currentVaultIds = new Set(normalizedVaults.map((vault) => vault.id));
    const latestSnapshotDate = latestSnapshot?.recorded_at.slice(0, 10);
    const latestSnapshotVaults = new Set(
        snapshotRows
            .filter((snapshot) => snapshot.recorded_at.slice(0, 10) === latestSnapshotDate)
            .map((snapshot) => snapshot.vault_id)
            .filter((vaultId) => currentVaultIds.has(vaultId)),
    );
    const firstSnapshot = [...snapshotRows]
        .sort((a, b) => Date.parse(a.recorded_at) - Date.parse(b.recorded_at))[0];
    const uniqueObservationDays = new Set(snapshotRows.map((snapshot) => snapshot.recorded_at.slice(0, 10))).size;
    const collectionDays = firstSnapshot && latestSnapshot
        ? (Date.parse(latestSnapshot.recorded_at) - Date.parse(firstSnapshot.recorded_at)) / 86_400_000
        : 0;
    const estimatedReadyAt = firstSnapshot
        ? new Date(Date.parse(firstSnapshot.recorded_at) + MINIMUM_ANALYSIS_DAYS * 86_400_000).toISOString()
        : null;
    const analysisByVault = new Map(analyzed.map(({ vault, analysis }) => [vault.id, analysis]));
    const portfolioVaults: PortfolioVault[] = normalizedVaults.map((vault) => {
        const latest = vault.snapshots[vault.snapshots.length - 1];
        const first = vault.snapshots[0];
        const analysis = analysisByVault.get(vault.id);
        const measurementDays = first && latest
            ? (Date.parse(latest.recorded_at) - Date.parse(first.recorded_at)) / 86_400_000
            : 0;

        return {
            id: vault.id,
            name: vault.name,
            tvl: vault.numericTvl,
            currentApy: vault.apy,
            latestPps: latest ? Number(latest.price_per_share) : null,
            observations: vault.snapshots.length,
            measurementDays,
            latestRecordedAt: latest?.recorded_at ?? null,
            blockNumber: latest?.block_number ? Number(latest.block_number) : null,
            status: analysis
                ? analysis.driftPercent <= -5 ? 'review' : 'ready'
                : latest ? 'collecting' : 'no-data',
            driftPercent: analysis?.driftPercent ?? null,
        };
    });

    return {
        status: hasSnapshots ? 'live' : 'empty',
        quality: isReady ? 'ready' : hasSnapshots ? 'collecting' : 'unavailable',
        message: isReady
            ? `Drift is calculated from interval-matched APY and PPS observations over at least ${MINIMUM_ANALYSIS_DAYS} days.`
            : hasSnapshots
                ? `Collecting a minimum of ${MINIMUM_OBSERVATIONS} observations across ${MINIMUM_ANALYSIS_DAYS} days before calculating drift.`
                : 'No PPS observations have been recorded yet.',
        updatedAt,
        trackedVaults: normalizedVaults.length,
        readyVaults: analyzed.length,
        totalTvl,
        weightedApy,
        analyzedTvl,
        underperformingTvl: flaggedVaults.reduce((sum, vault) => sum + vault.tvl, 0),
        portfolioExpectedApy,
        portfolioActualApy,
        annualizedYieldGapUsd: analyzed.reduce(
            (sum, { vault, analysis }) => sum + vault.numericTvl * (analysis.expectedApy - analysis.actualApy),
            0,
        ),
        analysisCoveragePercent: normalizedVaults.length > 0 ? analyzed.length / normalizedVaults.length * 100 : 0,
        latestSnapshotCoveragePercent: normalizedVaults.length > 0 ? latestSnapshotVaults.size / normalizedVaults.length * 100 : 0,
        uniqueObservationDays,
        collectionDays,
        firstSnapshotAt: firstSnapshot?.recorded_at ?? null,
        estimatedReadyAt,
        portfolioVaults,
        flaggedVaults,
        chartVaultName: chartCandidate?.vault.name ?? null,
        driftPoints: chartCandidate?.analysis.points ?? [],
        latestBlockNumber: latestSnapshot?.block_number ? Number(latestSnapshot.block_number) : null,
        latestBlockHash: latestSnapshot?.block_hash ?? null,
        providerLabel: latestSnapshot?.provider_label ?? null,
    };
}

export async function getDashboardData(): Promise<DashboardData> {
    if (!hasSupabaseReaderConfiguration()) {
        return emptyDashboard('unconfigured', 'Supabase read credentials are not configured for this deployment.');
    }

    try {
        const supabase = createSupabaseReader();
        const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
        const [vaultResult, snapshotResult] = await Promise.all([
            supabase
                .from('vaults')
                .select('id,name,chain,target_apy,tvl,updated_at')
                .eq('chain', 'base')
                .eq('is_active', true)
                .order('tvl', { ascending: false }),
            supabase
                .from('pps_history')
                .select('vault_id,price_per_share,target_apy,tvl,recorded_at,block_number,block_hash,contract_address,provider_label,validation_status')
                .eq('validation_status', 'valid')
                .gte('recorded_at', since)
                .order('recorded_at', { ascending: true }),
        ]);

        if (vaultResult.error) throw vaultResult.error;
        if (snapshotResult.error) throw snapshotResult.error;

        return buildDashboardData(
            (vaultResult.data ?? []) as VaultRow[],
            (snapshotResult.data ?? []) as SnapshotRow[],
        );
    } catch (error) {
        console.error('Dashboard data query failed:', error);
        return emptyDashboard('error', 'The monitoring database is temporarily unavailable.');
    }
}
