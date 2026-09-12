# AutoSave — Product Requirements Document (PRD)

**Version:** 2.1  
**Date:** September 2026  
**Status:** Active  
**Owner:** Product / Founding Team

---

## 0. Scope

**AutoSave is a Solana-only product.**

- Supported chains: Solana mainnet-beta, devnet, testnet
- Wallets: Solana wallets only (Phantom, Solflare, Ledger, etc.)
- Tokens: SOL and SPL tokens
- No Ethereum, no L2s, no multi-chain bridges in scope

All features, automation, safety checks, and monitoring are designed exclusively for the Solana environment.

---

## 1. Overview

### 1.1 Product Name
**AutoSave** — powered by **AURA** (Autonomous Risk & Utility Allocation engine)

### 1.2 One-Liner
Intelligent Solana capital management: define your policy once. AURA maintains allocations, scores opportunities, enforces safety, and executes only when conditions are right.

### 1.3 Core Promise
“Tell AutoSave how you want your capital to behave. AURA keeps it in policy, protects the downside, and only deploys when the opportunity is real.”

### 1.4 Solution — Four Pillars (Solana)

1. **Smart Save (Capital Policy)**  
   User deposits SOL/USDC (or other SPL) and defines target allocations. AURA maintains the policy.

2. **AutoBuy Engine**  
   Intelligent buying driven by an Opportunity Score instead of blind timers.

3. **Safety Engine**  
   Pre-trade token, execution, and portfolio checks + kill switch.

4. **Opportunity Sniper**  
   Autonomous detection of emerging Solana opportunities that only fires when multiple conditions agree.

All non-custodial. All on Solana.

---

## 2. Smart Save — Capital Policy Engine

Users deposit SOL or USDC (SPL) and define a capital policy.

**Example Policy**

| Bucket              | Target |
|---------------------|--------|
| Reserve             | 40%    |
| AutoBuy             | 25%    |
| Liquidity           | 20%    |
| Trading             | 10%    |
| Opportunity Reserve | 5%     |

AURA maintains targets and prioritizes protecting the Reserve when risk rises.

---

## 3. AutoBuy Engine

Scored, condition-aware buying on Solana (Jupiter routes preferred).

Opportunity Score dimensions include liquidity, volume, momentum, execution quality, and risk. User sets a minimum threshold. Below threshold → NO TRADE.

---

## 4. Safety Engine

Before every transaction:

- Token checks (mint/freeze authority, liquidity, holders, etc.)
- Execution checks (slippage, price impact, simulation)
- Portfolio checks + Kill Switch

---

## 5. Opportunity Sniper

Monitors new Solana token / pool launches. Only surfaces and acts on names that pass **good liquidity** and safety filters. Uses Opportunity Reserve by default.

---

## 6. Portfolio Equity

- Starting equity snapped from live on-chain balances
- Gains are **added** to equity
- Losses are **subtracted** from equity
- Same flow on mainnet, devnet, and testnet

---

## 7. Non-Goals

- Any non-Solana chain
- Multi-chain portfolio views
- EVM wallets or bridges as core features
- Custodial accounts

---

## 8. Technical Stack (Solana)

- Next.js + Solana Wallet Adapter
- `@solana/web3.js`
- Helius (or similar) RPC
- Jupiter for swaps
- Solana Agent Kit (execution layer, upcoming)
- Raydium / Orca / Meteora for liquidity where integrated

---

*Living document. Solana-only.*
