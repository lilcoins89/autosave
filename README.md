# AutoSave — Powered by AURA

**Intelligent Solana capital management.**

Define your capital policy once. AURA maintains allocations, scores every opportunity, enforces hard safety limits, and only deploys capital when conditions are actually good.

## Run the App

```bash
git clone https://github.com/lilcoins89/autosave.git
cd autosave/app
cp .env.example .env.local
# Add your Helius RPC URL to .env.local
npm install
npm run dev
```

Open **http://localhost:3000**

### Helius RPC (recommended)

1. Get a free API key at [helius.dev](https://helius.dev)
2. In `app/.env.local`:

```env
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

Without this, the app uses the public Solana RPC (fine for light local testing).

### What is live today

- Real wallet connection (Phantom, Solflare, Ledger)
- Live **SOL balance** and **SPL token balances** (USDC, etc.)
- Auto-refresh + manual refresh
- Full AURA dashboard UI (policy, score, safety, decisions)

## Core Pillars

1. **Smart Save** — Capital policy engine
2. **AutoBuy Engine** — Opportunity Score
3. **Safety Engine** — Checks + Kill Switch
4. **Opportunity Sniper** — Multi-condition detection

## Docs

- [PRD v2](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [App README](app/README.md)

## License

MIT
