# 📄 PRD: Beefy Yield-Fidelity Monitor
**Version**: 1.2
**Status**: Base production data collection
**Owner**: Rahil Bhavan (University of Michigan)

## 1. Executive Summary
### Objective
Develop a decision-support dashboard that distinguishes headline yield from observed vault-share growth and transaction friction. The current Base deployment is designed to help users evaluate break-even timing and help strategy reviewers prioritize material yield exceptions.

### Target Audience
- **Retail Users**: Need to know their "Break-Even" time before depositing.
- **Strategy Reviewers**: Need to identify vaults where observed price-per-share growth is materially below the interval-matched target.

## 2. Problem Statement
- **The Gas Gap**: Users depositing small amounts (under $1k) often don't realize that L2 gas fees and Beefy’s performance fees can make their net return negative for the first 30+ days.
- **Strategy Drift**: Realized vault-share growth can differ from the yield reported when each observation was recorded. The monitor surfaces the variance without claiming a cause until a reviewer investigates it.

## 3. Functional Requirements
### FR1: The "Break-Even" Calculator (Next.js)
- **Input**: Users enter their intended deposit ($) and select a vault.
- **Logic**: Fetch current network gas prices and apply the formula:
  $$\text{Break-Even Days} = \frac{\text{Estimated Entry Cost} + \text{Estimated Exit Cost}}{\text{Effective Daily Yield}}$$
- **Output**: An estimated break-even horizon plus downside, current, and upside sensitivity scenarios.

### FR2: The "Yield Health" Dashboard (Supabase)
- **Historical Tracking**: Store `pricePerFullShare` data daily.
- **Drift Analysis**: Calculate the delta between Expected Yield (from Beefy API) and Actual Growth (from PPS change).
- **Visualization**: Interactive charts showing the "Yield Curve" vs. the "Efficiency Floor."
- **Validity Gate**: Require at least three valid observations spanning seven
  days and store APY, TVL, contract, block, raw PPS, decimals, provider, and run
  provenance with every observation.
- **Decision Support**: Present portfolio-weighted expected and realized APY,
  capital passing the validity gate, estimated annualized yield gap, snapshot
  coverage, and a recommendation appropriate to the evidence state.

### Deferred Scope: Multi-Chain Comparison
Multi-chain comparison is intentionally deferred. The current product completes
and validates the Base decision workflow before expanding the data model to
additional networks.

## 4. Technical Architecture
| Layer | Tech Stack | Responsibility |
|-------|------------|----------------|
| **Frontend** | Next.js + Tailwind | Responsive UI and "Break-Even" calculator components. |
| **Database** | Supabase (PostgreSQL) | Caching vault metadata and historical PPS (Price Per Share) values. |
| **API Integration** | Beefy API + Ethers.js | Fetching live APR, TVL, and on-chain gas prices. |
| **Automation** | Vercel Cron / GitHub Actions | Running daily "PPS Scrapers" to keep the Drift Analysis fresh. |

## 5. Success Metrics (KPIs)
- **Reliability SLO**: At least 99.5% successful daily scrapes over a 30-day operating window.
- **Freshness SLO**: Latest valid observation is less than 36 hours old.
- **Coverage SLO**: At least 95% of requested vaults produce valid daily observations.
- **Decision Integrity**: No drift result or recommendation is published before the evidence gate passes.
- **Reproducibility**: Every displayed drift result can be reconstructed from the public export and recorded provenance.

## 6. Implementation Roadmap
- **Completed — Milestone 1**: Base break-even calculator and sensitivity model.
- **Completed — Milestone 2**: Production schema, authenticated daily ingestion, provenance, health checks, and public export.
- **In progress — Milestone 3**: Accumulate the minimum live history and publish the first evidence-backed portfolio exception analysis.
- **Deferred — Milestone 4**: Evaluate multi-chain expansion after the Base operating window is validated.
