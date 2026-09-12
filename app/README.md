# AutoSave App (Next.js + Solana)

Real wallet integration, multi-network support (mainnet / devnet / testnet), Helius-ready RPC, and live on-chain balances.

## Quick Start

```bash
cd app
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Networks

Set the network in `.env.local`:

```env
# mainnet-beta | devnet | testnet
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

| Network        | Use case                    | USD estimates |
|----------------|-----------------------------|---------------|
| `mainnet-beta` | Production / real funds     | Yes (mock price) |
| `devnet`       | Development & testing       | Disabled      |
| `testnet`      | Additional test environment | Disabled      |

## Helius RPC (recommended)

```env
# Mainnet
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Devnet
# NEXT_PUBLIC_SOLANA_NETWORK=devnet
# NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

If `NEXT_PUBLIC_RPC_URL` is empty, the app uses the public Solana cluster URL for the selected network.

**Important:** Use a wallet that has funds on the same network you select (devnet SOL is different from mainnet SOL).

## What is live

- Wallet connection (Phantom, Solflare, Ledger)
- Network badge in navbar + dashboard
- Live SOL balance
- Live SPL token balances (USDC and others)
- Auto-refresh every 30s

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
