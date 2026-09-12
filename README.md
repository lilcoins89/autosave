# AutoSave — Powered by AURA

**Intelligent Solana capital management.**

## Run

```bash
git clone https://github.com/lilcoins89/autosave.git
cd autosave/app
cp .env.example .env.local
npm install
npm run dev
```

## Networks supported

| Network | Env value | Notes |
|---------|-----------|-------|
| **Mainnet** | `mainnet-beta` | Default. Real funds. |
| **Devnet** | `devnet` | Testing. Get free SOL from faucet. |
| **Testnet** | `testnet` | Additional test network. |

```env
# app/.env.local
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta   # or devnet / testnet

# Recommended: Helius RPC matching the network
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
# Devnet example:
# NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

## Live today

- Real wallet connection (Phantom, Solflare, Ledger)
- Mainnet / Devnet / Testnet support
- Live SOL + SPL token balances
- Network badge in UI
- Full AURA dashboard shell

## Docs

- [App README](app/README.md) — setup & env details
- [PRD v2](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)

## License

MIT
