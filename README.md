# AutoSave — Powered by AURA

**Solana-only** intelligent capital management with a full trading + savings engine.

## AURA Engine (core)

```
Raydium detect → token filter → AI score → size by capital policy
    → execute (Default / Warp / Jito)
    → TP/SL + wrong-activity auto-close
    → take profit / cut loss
    → auto-reinvest
```

### Speed & protection

- **Fast market detection** — Raydium listener (~2.2s cadence in sim; program subscribe in live)
- **Token filtering** — liquidity, authorities, age, holders, LP burn hint
- **AI opportunity scoring** — liquidity, volume, momentum, execution, risk
- **Wrong-activity close** — liquidity drain, authority risk, dump from peak, price collapse
- **Take-profit / stop-loss** — profile-based, checked every 1.5s
- **Jito / Warp / Default** execution
- **Slippage + price-impact guards**
- **Retries** with backoff

### Capital system

- **Smart Save** capital policy (Reserve / AutoBuy / Liquidity / Trading / Opportunity)
- **Autonomous allocation** by sleeve + max position %
- **Risk profiles** — Conservative / Balanced / Aggressive
- **DCA schedules**
- **Auto copy trading**
- **Auto sniper**
- **Automatic reinvestment** of profits
- **Portfolio equity** (gains add, losses subtract)
- **Paper trading** (default) + Live mode
- **Full dashboard** + audit trail

## Run

```bash
git clone https://github.com/lilcoins89/autosave.git
cd autosave/app
cp .env.example .env.local
npm install
npm run dev
```

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

1. Connect wallet  
2. Stay in **Paper**  
3. Click **Start engine** on the AURA panel  
4. Watch detections, filters, scores, entries, TP/SL, and emergency closes  

## Docs

- [App README](app/README.md)
- [Execution (Warp/Jito)](docs/EXECUTION.md)
- [PRD](docs/PRD.md)

## License

MIT
