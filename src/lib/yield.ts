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

export interface BreakEvenScenario {
    label: 'Downside' | 'Current' | 'Upside';
    apy: number;
    totalGasCostUsd: number;
    breakEvenDays: number | null;
}

export function buildBreakEvenScenarios(
    depositUsd: number,
    apy: number,
    entryCostUsd: number,
    exitCostUsd: number,
): BreakEvenScenario[] {
    return [
        { label: 'Downside', apyMultiplier: 0.75, costMultiplier: 1.5 },
        { label: 'Current', apyMultiplier: 1, costMultiplier: 1 },
        { label: 'Upside', apyMultiplier: 1.25, costMultiplier: 0.75 },
    ].map(({ label, apyMultiplier, costMultiplier }) => {
        const scenarioApy = apy * apyMultiplier;
        const result = calculateBreakEven(
            depositUsd,
            scenarioApy,
            entryCostUsd * costMultiplier,
            exitCostUsd * costMultiplier,
        );

        return {
            label: label as BreakEvenScenario['label'],
            apy: scenarioApy,
            totalGasCostUsd: result.totalGasCostUsd,
            breakEvenDays: result.breakEvenDays,
        };
    });
}
