import type { HistoricalRates } from '@/lib/drift';

export type RateBasis = 'headline' | 'expected' | 'realized';

export type HistoryState =
    | HistoricalRates
    | { status: 'loading' }
    | { status: 'unavailable'; reason: string };

export interface RateOption {
    basis: RateBasis;
    label: string;
    apy: number | null;
    /** Null when the option can be selected. */
    disabledReason: string | null;
}

/**
 * Lists the APY inputs the calculator can use for a vault. Historical inputs are
 * disabled, with a reason, until the snapshot history supports them.
 */
export function buildRateOptions(headlineApy: number, history: HistoryState): RateOption[] {
    const headline: RateOption = {
        basis: 'headline',
        label: 'Headline APY (live)',
        apy: headlineApy,
        disabledReason: null,
    };

    const historicalReason = history.status === 'loading'
        ? 'Loading snapshot history…'
        : history.status === 'ready' ? null : history.reason;
    const ready = history.status === 'ready' ? history : null;

    return [
        headline,
        {
            basis: 'expected',
            label: 'Time-weighted recorded APY',
            apy: ready?.expectedApy ?? null,
            disabledReason: historicalReason,
        },
        {
            basis: 'realized',
            label: 'Realized share-price growth',
            apy: ready?.realizedApy ?? null,
            disabledReason: historicalReason,
        },
    ];
}

/** Returns the requested option when it is usable, otherwise the headline option. */
export function resolveRateOption(requested: RateBasis, options: RateOption[]): RateOption {
    const match = options.find((option) => option.basis === requested);
    if (match && match.disabledReason === null && match.apy !== null) return match;
    return options.find((option) => option.basis === 'headline') ?? options[0];
}
