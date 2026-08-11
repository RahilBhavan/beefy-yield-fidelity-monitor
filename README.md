# Beefy yield–fidelity monitor

Next.js dashboard for **transparent net yield** on Beefy vaults: break-even timing, gas and fee friction, and drift between advertised APR and realized **price-per-share** growth.

## Why this exists

- **Gas gap:** Small deposits can stay **net negative** for weeks after entry + exit gas and performance fees.
- **Strategy drift:** Realized APY depends on `harvest()` cadence and TVL; users may earn less than the headline APR suggests.

This app surfaces **break-even** and **yield health** so users and strategists see friction-adjusted numbers, not only headline rates.

## Stack

- **Frontend:** Next.js (App Router), React 19, Tailwind CSS v4, Framer Motion
- **Data:** Supabase (PostgreSQL) for historical vault / PPS-style tracking (see [PRD.md](PRD.md))
- **On-chain / APIs:** Beefy metadata, Ethers.js v6 for gas and chain context

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run lint
```

Copy `.env.example` to `.env.local` and supply Supabase credentials plus a strong
`CRON_SECRET`. `BASE_RPC_URLS` is optional; the public Base RPC is always retained
as a fallback.

Apply the Supabase migrations, then invoke `/api/cron/scrape` with
`Authorization: Bearer <CRON_SECRET>` to create the first on-chain PPS snapshot.
Vercel runs this route daily through `vercel.json`. Drift requires at least three
valid observations spanning seven days.

```bash
npm run test
npm run check
npm run test:integration
npm run test:e2e
```

Operational readiness, release steps, freshness objectives, and incident response
are documented in [docs/OPERATIONS.md](docs/OPERATIONS.md). The application also
exposes `/api/health`, a reproducible observation export at `/api/export`, and a
public methodology page at `/methodology`.

## Status

**Active development** — the current MVP covers active Base vaults, estimates
entry/exit friction including Base L1 fee bounds, and records daily on-chain PPS
for Supabase-backed drift charts. Multi-chain monitoring is not yet implemented.

## Accuracy boundary

Expected growth uses the APY stored with each PPS observation rather than applying
today's APY retroactively. Every new observation includes its Base block, raw PPS,
decimals, contract, provider label, TVL, and scrape-run provenance. The default gas
result is a planning estimate; `/api/gas-estimate` can simulate fully prepared Base
vault transactions for wallet-aware clients.

## License

No license has been selected. Resolve licensing and Beefy brand-usage approval
before external distribution; repository access alone does not grant reuse rights.
