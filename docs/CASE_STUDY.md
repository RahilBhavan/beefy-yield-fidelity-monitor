# Yield/Fidelity: From Headline Yield to Decision Support

## Executive summary

Yield/Fidelity is an independent financial-analysis project that asks two decision questions conventional yield interfaces do not answer:

1. How long will expected earnings take to recover entry and exit costs?
2. Is a vault's observed price-per-share growth keeping pace with the yield reported during the same period?

The collector selects up to 50 active Beefy vaults on Base by TVL, combines market and on-chain data, and withholds performance conclusions until at least three valid observations span seven days. The result is a reproducible exception-review workflow rather than a prediction or investment recommendation.

## Business challenge

A headline APY is easy to compare but incomplete for decision-making. A small position may take longer than expected to recover transaction costs, while today's APY cannot fairly explain performance over a historical window in which the rate changed.

This creates three risks:

- **Decision risk:** users may compare strategies without accounting for transaction friction.
- **Measurement risk:** analysts may apply a current rate retroactively and produce a misleading variance.
- **Communication risk:** an attractive dashboard may imply certainty before enough evidence exists.

## Analytical approach

### Break-even analysis

The planning model converts Beefy's reported APY to an effective daily rate and divides estimated Base entry and exit costs by expected daily earnings. It presents downside, current, and upside scenarios so the answer is not treated as a single-point forecast.

### Yield-fidelity analysis

Each daily observation records the vault contract, Base block, raw and normalized price per share, APY, TVL, provider, timestamp, and scrape-run identifier. Expected return is compounded interval by interval using the APY stored at the start of that interval. Realized return is compounded from consecutive PPS ratios.

A result is published only when:

- at least three observations are valid;
- the observations span at least seven days; and
- expected return is positive and mathematically valid.

### Decision outputs

Once the gate passes, the dashboard reports:

- analysis and latest-snapshot coverage;
- TVL passing the evidence gate;
- TVL-weighted expected and realized APY;
- capital associated with exceptions below the -5% threshold;
- a signed annualized yield-gap estimate; and
- a recommended next action matched to the evidence state.

The annualized gap is `Σ TVL × (expected APY − realized APY)`. It is an extrapolated comparison used to prioritize review—not a forecast, realized loss, or promise of future performance.

## Current evidence state

Production data collection began in August 2026. The seven-day evidence gate has passed for some vaults, allowing the dashboard to identify performance exceptions for review. These are variance signals, not conclusions about their causes. Recommendations depend on current freshness and snapshot coverage; the public export preserves the observations and provenance needed to inspect each signal. The live dashboard shows the current count and freshness rather than relying on a fixed figure in this document.

## Controls and operating model

- Idempotent daily ingestion prevents duplicate vault/date observations.
- Authentication and server-only credentials protect write access.
- PostgreSQL constraints and row-level security enforce data boundaries.
- Invalid reads are rejected while their failure provenance is preserved.
- Health monitoring checks Base RPC reachability, observation freshness, and latest-snapshot coverage.
- CSV/JSON export of the rolling 90-day analysis window makes displayed results independently reproducible.
- Unit, route, database, browser, accessibility, build, and dependency checks run in CI; live integration and load-smoke checks remain explicit opt-in verification commands.

## Recommendation framework

| Evidence state | Dashboard recommendation |
| --- | --- |
| Unavailable | Restore ingestion or database access before drawing conclusions. |
| Collecting | Continue daily collection and verify snapshot coverage. |
| Stale or incomplete | Restore freshness and coverage before acting on historical variance. |
| Ready, no exceptions | Continue monitoring; the threshold does not support intervention. |
| Ready, exceptions present | Prioritize the most material variance, validate its provenance, and investigate strategy operations before acting. |

## Limitations

The project measures vault-share growth and execution friction. It does not model token-price exposure, impermanent loss, slippage, bridge costs, taxes, protocol exploits, or future APY. Beefy-reported APY is an external input, and short measurement windows can produce volatile annualized results. Results are informational and are not financial advice.

## Portfolio walkthrough

Start with the [calculator](https://yield.rahilbhavan.com/) to show how deposit size and estimated entry and exit fees change break-even time. Then open the [dashboard](https://yield.rahilbhavan.com/dashboard), read the freshness and coverage indicators, and inspect a vault that passes the evidence gate. Use the [methodology](https://yield.rahilbhavan.com/methodology) and [CSV export](https://yield.rahilbhavan.com/api/export) to show how the interval comparison can be checked against source observations and block provenance.

## Resume bullet options

- Built a Next.js and Supabase monitor for up to 50 Base vaults that compares interval-matched reported APY with on-chain price-per-share growth.
- Implemented authenticated daily ingestion with same-block contract reads, PostgreSQL constraints, and provenance-backed CSV export for reproducible yield analysis.
- Designed a transaction-cost break-even calculator and an evidence gate that requires three valid observations across seven days before publishing vault drift.

These bullets describe implemented features. Add measured uptime, user adoption, or performance results only after recording them from a defined observation period.

## Skills demonstrated

- Gathering and reconciling market, blockchain, and operational data.
- Designing a controlled variance-analysis methodology.
- Translating complex calculations into management-level recommendations.
- Communicating uncertainty and refusing unsupported conclusions.
- Building a reproducible, monitored analytical workflow.

Live application: [yield.rahilbhavan.com](https://yield.rahilbhavan.com)

Source and verification instructions: [README.md](../README.md)
