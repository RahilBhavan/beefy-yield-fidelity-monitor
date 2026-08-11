export function dailyRateFromApy(apy: number): number {
    if (!Number.isFinite(apy) || apy <= 0) return 0;
    return Math.pow(1 + apy, 1 / 365) - 1;
}

export function calculateBreakEven(
    depositUsd: number,
    apy: number,
    entryCostUsd: number,
    exitCostUsd: number,
) {
    const dailyYieldUsd = depositUsd * dailyRateFromApy(apy);
    const totalGasCostUsd = entryCostUsd + exitCostUsd;
    const exactDays = dailyYieldUsd > 0 ? totalGasCostUsd / dailyYieldUsd : Infinity;

    return {
        dailyYieldUsd,
        totalGasCostUsd,
        breakEvenDays: Number.isFinite(exactDays) ? Math.ceil(exactDays) : null,
    };
}
