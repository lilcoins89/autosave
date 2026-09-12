import { CapitalPolicy } from "./types";

/** Micro-capital preset: $10 start → compound toward $50 */
export const MICRO_START_PRESET = {
  id: "micro_10_to_50",
  label: "Micro $10 → $50",
  startingCapitalUsd: 10,
  maxPerTradeUsd: 1,
  maxLossPerTradeUsd: 0.2,
  targetEquityUsd: 50,
  reserveUsd: 5,
  paperRequired: true as const,
  autoTpSl: true as const,
  killSwitchEnabled: true as const,
  /** Derived policy: $5 reserve of $10 = 50% */
  policy: {
    reservePct: 50,
    autoBuyPct: 10,
    liquidityPct: 10,
    tradingPct: 10,
    opportunityPct: 20,
  } satisfies CapitalPolicy,
  /** SL sized so $1 position loses at most ~$0.20 → 20% */
  stopLossPct: 20,
  takeProfitPct: 25,
  riskProfile: "balanced" as const,
};

export type MicroPreset = typeof MICRO_START_PRESET;
