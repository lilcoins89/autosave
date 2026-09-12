# AutoSave App (Next.js + Solana)

Real wallet integration, multi-network support, live balances, USD estimates on all networks, and a New Token Opportunity Monitor (good liquidity only).

## Quick Start

```bash
cd app
cp .env.example .env.local
npm install
npm run dev
```

## Networks

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta   # or devnet | testnet
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

## Features

- Wallet connection (Phantom, Solflare, Ledger)
- Mainnet / Devnet / Testnet
- Live SOL + SPL token balances
- **USD estimates enabled on all networks** (reference SOL price)
- **New Token Monitor** — only surfaces launches that pass:
  - Minimum liquidity (default $50k+)
  - Minimum score
  - Optional revoked mint/freeze authority requirement
- Safety Engine UI + Kill Switch
- Capital policy visualization

## Opportunity Monitor

The monitor filters aggressively for **good liquidity only**. Low-liquidity and open-authority tokens are excluded by default.

Currently uses structured demo data so the UI and filters are fully usable. Replace `fetchOpportunities` inside `src/hooks/useTokenOpportunities.ts` with:

- Helius webhooks / enhanced transactions for new pools
- Birdeye / DexScreener new pairs
- Custom indexer on Raydium / Meteora / Orca pool creation

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
