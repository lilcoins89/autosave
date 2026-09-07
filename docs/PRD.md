# AutoSave — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** September 2026  
**Status:** Draft for development  
**Owner:** Product / Founding Team

---

## 1. Overview

### 1.1 Product Name
**AutoSave**

### 1.2 One-Liner
A Solana-powered DeFi automation app that lets users save, automatically buy tokens (DCA), provide liquidity, and manage earned fees without manually performing every transaction.

### 1.3 Core Promise
“Tell AutoSave what you want to happen with your money, and it handles the repetitive on-chain work.”

### 1.4 Problem Statement
Using DeFi on Solana for recurring strategies is currently painful:
- Users must manually swap, add liquidity, claim fees, and reinvest on a schedule.
- Missing a few executions kills the strategy.
- Managing multiple positions and fee flows is complex and time-consuming.
- Existing tools are either pure DCA bots, pure LP managers, or complex terminals that feel like trading software rather than savings tools.

### 1.5 Solution
AutoSave combines four capabilities into one simple dashboard:
1. Automated savings (recurring deposits)
2. Automated token buying (DCA)
3. Liquidity pool creation and management
4. Automated fee claiming, allocation, and compounding

All non-custodial, with clear rules, spending limits, and full transparency.

### 1.6 Target Users
- Primary: Crypto-native users on Solana who want passive accumulation and yield strategies without constant management.
- Secondary: Newer DeFi users who understand the concepts of DCA and LP but find the operational overhead intimidating.
- Tertiary: Power users who want a clean layer on top of existing Solana DeFi protocols.

### 1.7 Success Metrics (North Star)
- Number of active strategies
- Total value locked / committed capital under automation
- Retention of strategies (users who keep strategies running > 30 / 90 days)
- Fees generated and compounded by the system
- User satisfaction (NPS / qualitative feedback on simplicity)

---

## 2. Goals & Non-Goals

### 2.1 Goals (MVP)
- Users can create and run recurring savings plans (SOL/USDC).
- Users can create DCA strategies into any supported token.
- Users can create and fund liquidity positions with basic configuration.
- Users can configure automatic fee splitting and compounding.
- Clear dashboard showing portfolio, AutoSaved amount, fees earned, and LP value.
- Full non-custodial control (withdraw / pause anytime).
- Transparent on-chain execution with transaction history.

### 2.2 Non-Goals (MVP)
- Cross-chain support
- Complex options strategies, perps, or leveraged positions
- Social / copy-trading features
- Custodial accounts or fiat on-ramps
- Mobile native apps (web-first)
- Token launches or advanced tokenomics features inside the app

---

## 3. User Personas

**Persona A — “Steady Accumulator”**  
Wants to DCA into a few tokens every week and occasionally provide liquidity. Hates having to remember to execute.

**Persona B — “Lazy LP Provider”**  
Provides liquidity but frequently forgets to claim and compound fees. Wants the fees to work for them automatically.

**Persona C — “Simple Saver”**  
Just wants to put SOL or USDC aside regularly and maybe later convert it into other assets. Values simplicity and safety over maximum yield complexity.

---

## 4. Features & Requirements

### 4.1 Wallet Connection
- Support major Solana wallets (Phantom, Backpack, Solflare, etc.) via standard wallet adapter.
- Display connected wallet address and basic balances.
- Non-custodial: private keys never leave the user’s wallet.

### 4.2 AutoSave Plans (Recurring Savings)
**User can:**
- Choose source asset: SOL or USDC
- Set amount per execution
- Choose cadence: Daily / Weekly / Monthly
- Set a maximum total spending limit / budget
- Optionally route the saved amount into a DCA or LP strategy

**System must:**
- Respect spending limits strictly
- Execute only when sufficient balance is available
- Provide clear next-execution time and history

### 4.3 Auto-Buy (DCA)
**User can:**
- Select any supported token
- Set buy amount (in SOL or USDC)
- Set cadence or simple price-triggered rules (MVP: time-based first)
- Set maximum total allocation and slippage tolerance

**System must:**
- Route through best available aggregator (Jupiter preferred)
- Record every buy with tx signature
- Allow pause / edit / delete of strategy

### 4.4 Liquidity Provision
**User can:**
- Select a token pair
- Configure initial liquidity amount and allocation split
- Choose pool strategy / venue (where supported)
- Set reinvestment percentage of future fees

**System must:**
- Handle creation of LP positions (or deposit into existing pools)
- Track position value and unclaimed fees
- Support basic position management (add / remove liquidity in later versions)

### 4.5 Automated Fee Management & Auto-Compound
**User can configure for each LP position:**
- Claim frequency or minimum fee threshold
- Allocation split, e.g.:
  - X% compound back into the same LP
  - Y% send to AutoSave / stable balance
  - Z% available as withdrawable balance

**System must:**
- Automatically claim → (optional swap) → reinvest according to rules
- Avoid uneconomic transactions (respect min thresholds and gas costs)
- Provide clear history of fee actions

### 4.6 Dashboard
**Must show:**
- Total Portfolio value
- AutoSaved amount
- Fees Earned (lifetime / period)
- LP Value
- List of Active Strategies with status (Active / Paused)
- Prominent “Create Strategy” action

**Additional views:**
- Strategy detail pages
- Transaction / activity log
- Portfolio breakdown

### 4.7 Safety & Controls
- Hard spending limits per strategy and global
- Pause / resume any strategy at any time
- Immediate withdraw of available balances and ability to close positions
- Clear warnings about impermanent loss and smart-contract risk
- Transaction simulation / preview before first execution of a new strategy where feasible

---

## 5. Technical Requirements

### 5.1 Core Stack (Recommended)
- Frontend: Next.js + TypeScript + Tailwind + Solana Wallet Adapter
- Blockchain interaction: Solana Agent Kit (for automated actions)
- Swaps: Jupiter Aggregator
- Payments / fee routing: Solana Pay Kit primitives where useful
- Backend / Scheduler: Combination of on-chain programs + off-chain keepers / session keys / crons (exact design TBD in architecture doc)
- Indexing: Helius / custom indexers for positions and fees

### 5.2 Non-Custodial Design Principles
- User signs all high-risk or large transactions
- Prefer session keys or limited allowances for recurring small actions
- Never hold user funds in a central hot wallet

### 5.3 Performance & Reliability
- Strategies should execute reliably within a reasonable window of the scheduled time
- Graceful handling of insufficient funds, high slippage, or failed transactions
- Retry logic with clear user notification

### 5.4 Security
- Smart contract audits before mainnet for any custom programs
- Thorough testing of automation edge cases
- Transparent, open-source where possible

---

## 6. User Experience Principles

1. **Simple first** — The default flow should feel closer to a savings app than a DeFi terminal.
2. **Transparent** — Every automated action is visible on-chain and in the activity log.
3. **Safe by default** — Spending limits, clear risk disclosures, easy pause/withdraw.
4. **Progressive disclosure** — Advanced allocation rules available but not required for basic use.
5. **Delightful feedback** — Clear confirmation when strategies are created and when they successfully execute.

---

## 7. MVP Scope Summary

**Must-have for launch:**
- Wallet connect
- Create AutoSave (savings) plan
- Create time-based DCA
- Create basic LP position + fee split configuration
- Dashboard with the four key metrics + active strategies list
- Pause / delete strategies
- Activity history

**Nice-to-have (post-MVP):**
- Price-triggered DCA
- Advanced concentrated liquidity strategies
- Multi-position portfolio optimization suggestions
- Notifications (email / Telegram / Discord)
- Mobile-responsive polish or PWA

---

## 8. Open Questions

- Exact mechanism for reliable recurring execution (keeper network vs session keys vs user-triggered with reminders)?
- Which LP venues to support first (Raydium, Orca, Meteora…)?
- Fee model for AutoSave itself (free, small performance fee, subscription)?
- How aggressive should default compounding be regarding gas costs?

---

## 9. Appendix

### Example User Flows
1. New user connects wallet → creates first weekly SOL savings plan → later adds a DCA into a meme token.
2. LP provider creates a SOL/USDC position → configures 70% compound / 30% AutoSave → watches fees accumulate and get reinvested automatically.

### Glossary
- **AutoSave Plan**: Recurring savings rule
- **DCA**: Dollar-Cost Averaging buy strategy
- **LP**: Liquidity Provider position
- **Fee Saver**: Rules for splitting and routing earned trading fees

---

*This PRD is a living document. Updates will be versioned.*
