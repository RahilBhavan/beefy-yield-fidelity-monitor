import type { DashboardData } from '@/lib/dashboard';

export interface HeadlineSummary {
    /** UTC date of the latest recorded snapshot. Every figure below is as of this date. */
    asOf: string;
    recordedAt: string;
    blockNumber: number | null;
    quality: DashboardData['quality'];
    capitalAnalyzedUsd: number;
    vaultsRequiringReview: number;
    annualizedGapUsd: number;
    trackedVaults: number;
    readyVaults: number;
    expectedApy: number;
    realizedApy: number;
    method: 'dashboard-computation';
}

/** Headline figures behind the dashboard, or null when there is no recorded snapshot. */
export function buildHeadlineSummary(data: DashboardData): HeadlineSummary | null {
    if (data.status !== 'live' || !data.updatedAt) return null;
    return {
        asOf: data.updatedAt.slice(0, 10),
        recordedAt: data.updatedAt,
        blockNumber: data.latestBlockNumber,
        quality: data.quality,
        capitalAnalyzedUsd: data.analyzedTvl,
        vaultsRequiringReview: data.flaggedVaults.length,
        annualizedGapUsd: data.annualizedYieldGapUsd,
        trackedVaults: data.trackedVaults,
        readyVaults: data.readyVaults,
        expectedApy: data.portfolioExpectedApy,
        realizedApy: data.portfolioActualApy,
        method: 'dashboard-computation',
    };
}
