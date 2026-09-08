# AutoSave + AURA — User Stories (v2)

## Epic: Smart Save (Capital Policy)
- As a user I can deposit capital and define percentage targets for Reserve, AutoBuy, Liquidity, Trading, and Opportunity Reserve.
- As a user I can see actual vs target allocation at any time.
- As a user I trust that AURA will not drain my Reserve just because other buckets are underweight when conditions are risky.

## Epic: AutoBuy Engine
- As a user I can set a minimum Opportunity Score below which no buys occur.
- As a user I can see the full score breakdown (Liquidity, Volume, Momentum, Execution, Risk) for any evaluated token.
- As a user I receive a clear “NO TRADE” decision with reasons when the score is insufficient.

## Epic: Safety Engine
- As a user I can configure Daily Loss Limit, Max Position Size, Max Slippage, Min Liquidity, and other hard limits.
- As a user I know that every trade is simulated and checked before execution.
- As a user I can activate a Kill Switch that immediately stops new risk-increasing trades.

## Epic: Opportunity Sniper
- As a user I can enable autonomous opportunity monitoring that only uses my Opportunity Reserve (or other allowed capital).
- As a user I understand that the Sniper only fires when multiple independent conditions + Safety + Score all agree.
- As a user I can review every Sniper evaluation and decision after the fact.

## Epic: Classic Automations
- Time-based savings, LP provision, and fee compounding continue to work and now sit under the capital policy and Safety Engine.
