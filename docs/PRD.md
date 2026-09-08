# AutoSave — Product Requirements Document (PRD)

**Version:** 2.0  
**Date:** September 2026  
**Status:** Active  
**Owner:** Product / Founding Team

---

## 1. Overview

### 1.1 Product Name
**AutoSave** — powered by **AURA** (Autonomous Risk & Utility Allocation engine)

### 1.2 One-Liner
Intelligent Solana capital management: define your policy once. AURA maintains allocations, scores opportunities, enforces safety, and executes only when conditions are right.

### 1.3 Core Promise
“Tell AutoSave how you want your capital to behave. AURA keeps it in policy, protects the downside, and only deploys when the opportunity is real.”

### 1.4 Problem Statement
Current DeFi automation is either:
- Blind (timer-based DCA / snipers that buy anything)
- Manual and exhausting
- Unsafe (no real portfolio risk controls or pre-trade safety)

Users want passive growth **without** sacrificing capital protection or intelligence.

### 1.5 Solution — Four Pillars

1. **Smart Save (Capital Policy)**  
   User deposits capital and defines target allocations. AURA continuously maintains the policy.

2. **AutoBuy Engine**  
   Intelligent buying driven by an Opportunity Score instead of blind timers.

3. **Safety Engine**  
   The heart of the product. Pre-trade token, execution, and portfolio checks + kill switch.

4. **Opportunity Sniper**  
   Autonomous detection of emerging opportunities that only fires when multiple independent conditions agree.

All non-custodial.

### 1.6 Target Users
- Capital-conscious Solana users who want automation without recklessness
- Users tired of blind DCA bots and snipers that ignore risk
- LP providers and savers who want intelligent fee and capital management

---

## 2. Smart Save — Capital Policy Engine

Users deposit SOL or USDC and define a capital policy.

**Example Policy ($1,000)**

| Bucket              | Target |
|---------------------|--------|
| Reserve             | 40%    |
| AutoBuy             | 25%    |
| Liquidity           | 20%    |
| Trading             | 10%    |
| Opportunity Reserve | 5%     |

**AURA behavior**
- Continuously monitors actual vs target allocations
- Rebalances toward targets when drift exceeds thresholds (user-configurable)
- **Never** blindly deploys remaining capital into risky buckets if conditions deteriorate
- Always prioritizes preserving the Reserve
- Opportunity Reserve is only used when high-conviction signals appear

Users can edit the policy at any time. Changes take effect on the next evaluation cycle.

---

## 3. AutoBuy Engine

Replaces dumb timer-based DCA with scored, condition-aware buying.

### 3.1 Evaluation Dimensions
Before any buy, AURA evaluates:

- Liquidity depth & concentration
- Volume profile
- Price movement & momentum
- Volatility
- Holder distribution
- Token permissions (mint / freeze authority)
- Market depth & price impact
- Available routes & execution quality
- Transaction cost vs expected edge
- Upside / downside asymmetry

### 3.2 Opportunity Score

```
Liquidity        92
Volume           87
Momentum         81
Execution        96
Risk             18   (lower is better)
────────────────────
AURA SCORE       88/100

ACTION: BUY
```

User sets a minimum score threshold (e.g. 75). Below threshold → **NO TRADE**.

This is fundamentally different from conventional snipers or pure time-based DCA.

---

## 4. Safety Engine (Core of the Product)

Before **every** transaction, AURA runs three layers of checks.

### 4.1 Token Checks
- Mint authority status
- Freeze authority status
- Liquidity amount and recent changes
- Holder concentration
- Suspicious trading patterns
- Trading availability / honeypot signals

### 4.2 Execution Checks
- Slippage vs user max
- Price impact
- Route quality
- Minimum received amount
- Network congestion
- Full transaction simulation

### 4.3 Portfolio Checks & Kill Switch

Configurable limits (example):

```
Daily Loss Limit       5%
Max Position Size      3%
Max Slippage           1%
Min Liquidity          $100k
Max Token Allocation   8%
Max Gas / period       user-defined
```

If any hard limit is breached:

```
STOP NEW TRADES
Protect capital
Notify user
```

Kill switch can also be triggered manually. When active, only risk-reducing actions (or none) are allowed.

---

## 5. Opportunity Sniper

**Not** marketed as “a faster sniper.”

Marketed as: **Opportunity Sniper**

- Watches for newly emerging tokens / liquidity events / narrative shifts
- Requires multiple independent conditions to agree before execution
- Still fully gated by the Safety Engine and the user’s Opportunity Score threshold
- Uses the Opportunity Reserve bucket by default
- Transparent reasoning shown to the user after every evaluation

Philosophy: Speed without intelligence is just risk. Intelligence first.

---

## 6. Classic Automations (Still Supported)

- Time-based savings plans
- Traditional DCA (can be upgraded to scored AutoBuy)
- Liquidity provision + fee compounding
- Fee Saver allocation rules

These now run **inside** the capital policy and under the Safety Engine.

---

## 7. Dashboard Requirements (Updated)

Must surface:

- Current capital policy vs actual allocation (visual)
- Portfolio value + Reserve health
- Active Opportunity Score for watched tokens
- Safety status / Kill Switch state
- Recent AURA decisions (Buy / No Trade + score breakdown)
- Classic strategy list (savings, LP, etc.)

---

## 8. Goals & Non-Goals

### Goals
- Capital policy that is actually maintained
- Opportunity-aware buying instead of blind buying
- Safety as a first-class, non-bypassable layer
- Transparent decisioning (users can see why AURA acted or refused)
- Non-custodial throughout

### Non-Goals (near term)
- Cross-chain
- Leveraged / perpetual strategies
- Social copy-trading
- Custodial products

---

## 9. Technical Notes

- Solana Agent Kit for execution
- Jupiter for routing
- Real-time data: Birdeye / Helius / on-chain + custom indexers for scoring inputs
- Safety checks must be fast and reliable; simulation is mandatory for sizeable trades
- Policy and limits stored with clear user ownership / signature

---

## 10. Version History

- **v1.0** — Basic AutoSave (savings + DCA + LP + fee management)
- **v2.0** — AURA layer: Smart Save capital policy, scored AutoBuy, Safety Engine, Opportunity Sniper

---

*Living document.*
