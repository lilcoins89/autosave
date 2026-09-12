# AutoSave App (Next.js + Solana Wallet)

Real Next.js application with Solana wallet adapter integration and the full AURA dashboard.

## Quick Start

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Real wallet connection** via `@solana/wallet-adapter` (Phantom, Solflare, Ledger)
- Auto-connect support
- Landing page with four AURA pillars
- Full dashboard gated behind wallet connection
- Smart Save capital policy visualization
- Opportunity Score panel
- Safety Engine + Kill Switch UI
- Recent AURA decision log
- Responsive dark theme

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- `@solana/web3.js`
- `@solana/wallet-adapter-react` + UI + wallets

## Production Notes

- Replace `clusterApiUrl("mainnet-beta")` with a dedicated RPC (Helius, QuickNode, Triton, etc.) for reliability.
- Add environment variables for RPC URL if desired (`NEXT_PUBLIC_RPC_URL`).
- Session keys / limited authorities and on-chain execution come in later phases (Solana Agent Kit integration).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — start production server
