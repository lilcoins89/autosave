# AutoSave + AURA — Architecture Overview (v2)

## High-Level

```
User Wallet
     ↓
Frontend (Dashboard + Policy UI)
     ↓
AURA Engine
  ├─ Capital Policy Manager (Smart Save)
  ├─ AutoBuy Scorer (Opportunity Score)
  ├─ Safety Engine (Token + Execution + Portfolio)
  ├─ Opportunity Sniper
  └─ Execution Layer (Solana Agent Kit + Jupiter)
     ↓
Solana
```

## Core Modules

### 1. Capital Policy Manager (Smart Save)
- Stores user-defined target percentages
- Tracks actual allocations across Reserve / AutoBuy / LP / Trading / Opportunity Reserve
- Triggers rebalancing only when drift is significant and Safety Engine allows
- Hard preference for preserving Reserve

### 2. AutoBuy / Opportunity Scorer
Inputs: liquidity, volume, momentum, volatility, holder distribution, permissions, depth, routes, cost, asymmetry
Output: structured Opportunity Score + recommended ACTION (BUY / NO TRADE)
Threshold is user-controlled.

### 3. Safety Engine (Heart of the system)
Three gate layers run on every proposed transaction:
1. Token safety
2. Execution quality & simulation
3. Portfolio limits + Kill Switch

Any hard failure → block the trade and log the reason.

### 4. Opportunity Sniper
Event-driven watcher for new liquidity / narrative / volume spikes.
Only proposes trades that also pass Opportunity Score threshold and full Safety Engine.

### 5. Execution Layer
Solana Agent Kit + Jupiter. All actions remain non-custodial. Session keys / limited authorities used only within user-defined bounds.

## Data Sources
- On-chain state
- Helius / Birdeye / similar for market & token metadata
- Transaction simulation before sizeable executions

## Safety First Principle
No module is allowed to bypass the Safety Engine. This is non-negotiable product architecture.
