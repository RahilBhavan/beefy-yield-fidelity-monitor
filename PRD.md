# 📄 PRD: Beefy Yield-Fidelity Monitor
**Version**: 1.0
**Status**: Proposal / Draft
**Owner**: Rahil Bhavan (University of Michigan)

## 1. Executive Summary
### Objective
To develop a high-fidelity monitoring dashboard that provides real-time transparency into Net Realized APY. The goal is to reduce user churn caused by "gas-shock" and to provide the DAO with an internal "Health Check" for vault strategy efficiency.

### Target Audience
- **Retail Users**: Need to know their "Break-Even" time before depositing.
- **DAO Strategists**: Need to identify vaults where actual growth (Price-per-Share) is lagging behind the projected APR.

## 2. Problem Statement
- **The Gas Gap**: Users depositing small amounts (under $1k) often don't realize that L2 gas fees and Beefy’s performance fees can make their net return negative for the first 30+ days.
- **Strategy Drift**: Realized APY depends on the frequency of the `harvest()` function. If a vault is harvested less frequently due to low TVL, the user earns less than the "Target APY" shown on the UI.

## 3. Functional Requirements
### FR1: The "Break-Even" Calculator (Next.js)
- **Input**: Users enter their intended deposit ($) and select a vault.
- **Logic**: Fetch current network gas prices and apply the formula:
  $$\text{Break-Even Days} = \frac{\text{Gas Entry} + \text{Gas Exit}}{\text{Daily Yield} - \text{Daily Fees}}$$
- **Output**: A countdown timer showing when the user becomes "profitable."

### FR2: The "Yield Health" Dashboard (Supabase)
- **Historical Tracking**: Store `pricePerFullShare` data daily.
- **Drift Analysis**: Calculate the delta between Expected Yield (from Beefy API) and Actual Growth (from PPS change).
- **Visualization**: Interactive charts showing the "Yield Curve" vs. the "Efficiency Floor."

### FR3: Multi-Chain Alerts
- **Feature**: A "Heat Map" of all Beefy-supported chains (Base, Arbitrum, etc.) showing which networks currently have the lowest "Friction" (Gas vs. Yield ratio).

## 4. Technical Architecture
| Layer | Tech Stack | Responsibility |
|-------|------------|----------------|
| **Frontend** | Next.js + Tailwind | Responsive UI and "Break-Even" calculator components. |
| **Database** | Supabase (PostgreSQL) | Caching vault metadata and historical PPS (Price Per Share) values. |
| **API Integration** | Beefy API + Ethers.js | Fetching live APR, TVL, and on-chain gas prices. |
| **Automation** | Vercel Cron / GitHub Actions | Running daily "PPS Scrapers" to keep the Drift Analysis fresh. |

## 5. Success Metrics (KPIs)
- **User Adoption**: % of unique visitors using the Calculator before clicking "Deposit."
- **Accuracy**: Drift analysis error margin < 0.5% compared to on-chain vault growth.
- **Engagement**: Increase in Average Deposit Size (by steering users away from "Gas-Negative" positions).

## 6. Implementation Roadmap
- **Milestone 1**: MVP of the Next.js Break-Even Calculator on one chain (Base).
- **Milestone 2**: Supabase schema design and initial PPS data scraping for top 50 vaults.
- **Milestone 3**: Full deployment of the "Yield Fidelity" dashboard with DAO-facing analytics.
