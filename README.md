# AutoSave — Powered by AURA

**Solana-only** intelligent capital management.

Define your capital policy once. AURA maintains allocations, scores every opportunity, enforces hard safety limits, and only deploys capital when conditions are actually good.

> This product is built exclusively for **Solana**. There is no multi-chain or EVM support.

## Run

```bash
git clone https://github.com/lilcoins89/autosave.git
cd autosave/app
cp .env.example .env.local
npm install
npm run dev
```

## Networks (Solana)

| Network | Env value | Notes |
|---------|-----------|-------|
| **Mainnet** | `mainnet-beta` | Default. Real funds. |
| **Devnet** | `devnet` | Testing. |
| **Testnet** | `testnet` | Additional test network. |

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

## Live today

- Solana wallet connection (Phantom, Solflare, Ledger)
- Mainnet / Devnet / Testnet
- Live SOL + SPL token balances
- USD estimates on all Solana networks
- Portfolio equity ledger (gains add, losses subtract)
- New Token Monitor (good liquidity only)
- Full AURA dashboard shell

## Core Pillars

1. **Smart Save** — Capital policy engine
2. **AutoBuy Engine** — Opportunity Score
3. **Safety Engine** — Checks + Kill Switch
4. **Opportunity Sniper** — Multi-condition detection

## Docs

- [App README](app/README.md)
- [PRD v2](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)

## License

MIT
