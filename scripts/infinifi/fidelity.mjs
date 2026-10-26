// Pure arithmetic for the infiniFi fidelity check. It repeats the interval maths of src/lib/drift.ts
// (log-return, annualised as expm1(logReturn * 365 / days)); fidelity.test.mjs pins the two together.

const DAY_MS = 86_400_000;

/** Annualised share-price growth between two rates over `days`. */
export function realizedApy(startRate, endRate, days) {
    if (!(startRate > 0) || !(endRate > 0) || !(days > 0)) return null;
    return Math.expm1(Math.log(endRate / startRate) * 365 / days);
}

/** Return earned over `days` by an APY that compounds annually, the way drift.ts converts expected yield. */
export function windowReturn(apy, days) {
    if (!Number.isFinite(apy) || apy <= -1 || !(days > 0)) return null;
    return Math.expm1(Math.log1p(apy) * days / 365);
}

/**
 * Compare one window of realised growth with the APY advertised for it. `gapPoints` is realised minus advertised
 * in percentage points of APY; `driftPercent` is the same difference over the window's expected return, as in
 * drift.ts, where −5% or lower sends a vault to review.
 */
export function compareWindow({ startRate, endRate, days, advertisedApy }) {
    const realized = realizedApy(startRate, endRate, days);
    if (realized === null) return null;
    if (advertisedApy === null || advertisedApy === undefined || !Number.isFinite(advertisedApy)) {
        return { realizedApy: realized, advertisedApy: null, gapPoints: null, driftPercent: null };
    }
    const actualReturn = windowReturn(realized, days);
    const expectedReturn = windowReturn(advertisedApy, days);
    return {
        realizedApy: realized,
        advertisedApy,
        gapPoints: (realized - advertisedApy) * 100,
        driftPercent: expectedReturn > 1e-6 ? ((actualReturn - expectedReturn) / expectedReturn) * 100 : null,
    };
}

/** Days between two unix timestamps in seconds. */
export function daysBetween(startTimestamp, endTimestamp) {
    return (endTimestamp - startTimestamp) * 1000 / DAY_MS;
}

/** Ratio of two non-negative bigints as a number, null when the denominator is zero. */
export function ratio(numerator, denominator) {
    if (denominator === 0n) return null;
    return Number((numerator * 1_000_000_000n) / denominator) / 1_000_000_000;
}

/** Convert a bigint with `decimals` to a number (display precision only). */
export function toNumber(value, decimals) {
    const scale = 10n ** BigInt(decimals);
    const whole = value / scale;
    const fraction = value % scale;
    return Number(whole) + Number(fraction) / Number(scale);
}

/**
 * Reserve ratio from on-chain balances (all in the same unit). `liquidReserves` is what the registry lists as
 * liquid farms; `instantlyWithdrawable` adds what maturity farms report as withdrawable now.
 */
export function reserveRatios({ liquidReserves, maturityInstant, totalDeposits, totalBacking }) {
    return {
        reserveRatio: ratio(liquidReserves, totalDeposits),
        reserveRatioOfBacking: ratio(liquidReserves, totalBacking),
        instantRatio: ratio(liquidReserves + maturityInstant, totalDeposits),
    };
}

/** Largest single drop between consecutive weekly rates, as a fraction (0 when the rate never fell). */
export function worstWeeklyFall(samples) {
    let worst = 0;
    for (let index = 1; index < samples.length; index += 1) {
        const change = samples[index].rate / samples[index - 1].rate - 1;
        if (change < worst) worst = change;
    }
    return worst;
}

/** Sample standard deviation of annualised daily growth, so a gap can be read against ordinary day-to-day noise. */
export function dailyApyDeviation(samples) {
    const daily = [];
    for (let index = 1; index < samples.length; index += 1) {
        const days = daysBetween(samples[index - 1].timestamp, samples[index].timestamp);
        const apy = realizedApy(samples[index - 1].rate, samples[index].rate, days);
        if (apy !== null) daily.push(apy);
    }
    if (daily.length < 2) return null;
    const mean = daily.reduce((sum, value) => sum + value, 0) / daily.length;
    const variance = daily.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (daily.length - 1);
    return { count: daily.length, meanApy: mean, standardDeviation: Math.sqrt(variance) };
}
