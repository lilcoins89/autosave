# AutoSave App (Next.js + Solana Wallet)

Real Next.js application with Solana wallet adapter, Helius-ready RPC, and live on-chain balances.

## Quick Start

```bash
cd app
cp .env.example .env.local
# Edit .env.local and add your Helius RPC URL
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Helius RPC Setup

1. Create a free account at [https://helius.dev](https://helius.dev)
2. Create an API key
3. Copy your mainnet RPC URL (looks like `https://mainnet.helius-rpc.com/?api-key=...`)
4. Put it in `.env.local`:

```env
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE
```

Restart the dev server after changing env vars.

If `NEXT_PUBLIC_RPC_URL` is empty, the app falls back to the public Solana mainnet RPC (rate-limited).

## What is live on-chain today

- SOL balance (real)
- SPL token balances (USDC, USDT, and other non-zero token accounts)
- Auto-refresh every 30s + manual Refresh button
- Wallet address display

Capital Policy bars, Opportunity Score, and AURA decision log are still illustrative UI until strategy state and scoring services are connected.

## Features

- Real wallet connection (Phantom, Solflare, Ledger)
- Auto-connect
- Helius / custom RPC via env
- Live SOL + token balances
- Full AURA dashboard shell
- Safety Engine + Kill Switch UI

## Tech Stack

- Next.js 15 (App Router)
- TypeScript + Tailwind
- `@solana/web3.js`
- `@solana/wallet-adapter-react` + UI + wallets

## Scripts

- `npm run dev` — development
- `npm run build` — production build
- `npm run start` — start production server
