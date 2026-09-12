# AURA Engine Architecture

Solana-only orchestration layer for AutoSave.

## Pipeline

```
RaydiumListener (fast detect)
        ↓
TokenFilter (liquidity, authorities, age, holders)
        ↓
scoreOpportunity (AI multi-factor score)
        ↓
CapitalPolicy sizing (opportunity / autoBuy sleeve + max position %)
        ↓
Entry (paper fill or Jupiter + Default/Warp/Jito executor)
        ↓
Health loop every 1.5s
   ├─ Take-profit hit  → close + optional reinvest
   ├─ Stop-loss hit    → close
   └─ Wrong activity   → emergency close
         · liquidity drain >40%
         · authority unsafe
         · dump >25% from peak
         · collapse >20% from entry
         · top-holder concentration
```

## Risk profiles

| Profile | Min score | Min liq | SL | TP | Slippage |
|---------|-----------|---------|----|----|----------|
| Conservative | 80 | $150k | 4% | 12% | 50 bps |
| Balanced | 70 | $50k | 6% | 18% | 100 bps |
| Aggressive | 60 | $25k | 10% | 30% | 150 bps |

## Capital policy (Smart Save)

Default: Reserve 40% · AutoBuy 25% · Liquidity 20% · Trading 10% · Opportunity 5%

Entries from the sniper use the **Opportunity** sleeve, capped by `maxPositionPct`.

## Key modules

| File | Role |
|------|------|
| `raydium-listener.ts` | Fast pool detection |
| `token-filter.ts` | Pre-trade hard filters |
| `wrong-activity.ts` | Instant exit signals |
| `capital-policy.ts` | Allocation + sizing |
| `aura-engine.ts` | Orchestrator |
| `lib/scoring.ts` | Opportunity score |
| `execution/*` | Default / Warp / Jito |

## UI entry

Dashboard → **AURA Engine** panel → Start engine / Kill all / risk profile / reinvest.
