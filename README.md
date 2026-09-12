# AutoSave — Powered by AURA

**Intelligent Solana capital management.**

Define your capital policy once. AURA maintains allocations, scores every opportunity, enforces hard safety limits, and only deploys capital when conditions are actually good.

## Live Next.js App (Real Wallet Integration)

```bash
cd app
npm install
npm run dev
```

Then open **http://localhost:3000**

- Connect Phantom / Solflare / Ledger
- Full landing page + authenticated dashboard
- Smart Save policy bars, Opportunity Score, Safety Engine, AURA decision log

See [`app/README.md`](app/README.md) for details.

## Static Prototype (no install)

The earlier static HTML version is still available under [`website/`](website/) for quick viewing.

## Core Pillars

1. **Smart Save** — Capital policy engine (Reserve / AutoBuy / Liquidity / Trading / Opportunity Reserve)
2. **AutoBuy Engine** — Opportunity Score instead of blind timers
3. **Safety Engine** — Token + Execution + Portfolio checks + Kill Switch
4. **Opportunity Sniper** — Multi-condition autonomous detection

## Documentation

- [PRD v2](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [User Stories](docs/USER_STORIES.md)
- [Roadmap](docs/ROADMAP.md)

## Philosophy

Speed without intelligence is just risk.  
AURA puts intelligence and capital protection first.

## License

MIT
