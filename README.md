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

Add Supabase and RPC keys in `.env.local` when you wire ingestion (see [PRD.md](PRD.md)).

## Status

**Active development** — MVP targets a break-even calculator on Base, then Supabase-backed drift charts for top vaults (see roadmap in [PRD.md](PRD.md)).

## License

See repository root for `LICENSE` if present; otherwise default repository terms apply.
