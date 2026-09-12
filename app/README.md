# AutoSave App — Solana-only

Paper/live trading, Jupiter swaps with safeguards, DCA, TP/SL, position PnL, auto sniper, copy trading, audit trail.

## Quick start

```bash
cd app
cp .env.example .env.local
npm install
npm run dev
```

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta   # or devnet | testnet
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

## Feature map (this release)

| # | Feature | Status |
|---|---------|--------|
| 1 | Real tx execution + safeguards | Live path via Jupiter + preflight + retries; blocked by impact/slippage guards |
| 2 | Jupiter routing / swaps | Quote + swap build; max slippage 1%, max impact 1.5% |
| 3 | Automated DCA / savings | Schedules (daily/weekly/monthly), max budget, paper/live run |
| 4 | Take-profit / stop-loss | Per-position TP/SL; auto-evaluated every 5s |
| 5 | Position-level P&amp;L | Open positions + unrealized; closed trades + realized |
| 6 | Paper / simulation mode | Default **Paper**; toggle to **Live** when ready |
| 7 | Tx history + audit trail | Quotes, submits, success/fail, paper fills, DCA, TP/SL, safety blocks |
| 8 | Failure / retry handling | `withRetry` on quotes and sends |
| 9 | Richer opportunity scoring | Liquidity, volume, momentum, execution, authority/holder risk |
| 10 | Mobile-first UX | Bottom nav, tighter spacing, touch-friendly controls |

## Safety defaults (live)

- Slippage: 100 bps (1%)
- Max price impact: 1.5% (hard block)
- Preflight enabled
- Retries with exponential backoff
- Paper mode recommended until you understand the flow

## Important

- **Solana only**
- Live swaps spend real funds — use Paper first
- USDC mint in live path is mainnet USDC; use matching network + funds

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
