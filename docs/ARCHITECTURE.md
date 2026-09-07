# AutoSave — Architecture Overview

## High-Level Architecture

```
User Wallet (Phantom / Backpack / etc.)
          ↓
     Frontend (Next.js)
          ↓
   AutoSave Engine (Rules + Scheduler)
          ↓
  Solana Agent Kit  ↔→  Jupiter / Raydium / Orca / Meteora
          ↓
     Solana Blockchain
```

## Key Components

### 1. Frontend
- Next.js + TypeScript
- Solana Wallet Adapter
- Dashboard, strategy creation wizards, activity feed
- Reads portfolio state via RPC + indexers

### 2. AutoSave Engine
Responsible for:
- Storing user strategy configurations (signed by user or stored with user ownership proof)
- Scheduling executions
- Enforcing spending limits and rules
- Deciding when to claim / compound
- Coordinating with Solana Agent Kit for actual on-chain actions

### 3. Solana Agent Kit Integration
Used for:
- Token swaps
- Adding/removing liquidity
- Claiming fees
- Any other DeFi operations required by strategies

### 4. Solana Pay Kit / Payment Primitives
Useful for:
- Clean fee routing and settlement
- Programmable transfers according to allocation rules

### 5. Data Layer
- On-chain: LP positions, token balances, actual transactions
- Off-chain: Strategy definitions, user preferences, execution schedules, aggregated metrics
- Indexing: Helius or equivalent for fast portfolio and fee queries

## Execution Model (Open Design Area)
Several options exist for recurring automation:
1. Fully on-chain programs with crank/keeper network
2. Session keys / limited authorities granted by the user
3. Off-chain scheduler that prepares transactions for user signature (less seamless)
4. Hybrid approaches

MVP will likely start with a practical hybrid that prioritizes security and reliability.

## Security Considerations
- Non-custodial by design
- Minimal privileges for any automation authority
- Spending limits enforced both in the engine and (where possible) on-chain
- Clear user consent for every new strategy type
- Audits required for any custom Solana programs

## Future Extensibility
- Plugin-style support for new DEXes and LP venues
- More sophisticated triggers (price, volatility, portfolio rebalancing)
- Notifications and multi-channel alerts
- Potential mobile / PWA layer
