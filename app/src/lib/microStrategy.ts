/**
 * Preset micro-compound strategy
 * Starting $10 → target $50 with strict risk controls (paper-first).
 */

import { CapitalPolicy } from "@/engine/types";

export const MICRO_STRATEGY = {
  id: "micro_10_to_50",
  label: "Micro Compound $10 → $50",
  startingCapitalUsd: 10,
  maxPerTradeUsd: 1,
  maxLossPerTradeUsd: 0.2,
  targetEquityUsd: 50,
  reserveUsd: 5,
  /** Derived stop from $1 size and $0.20 max loss = 20% SL */
  stopLossPct: 20,
  takeProfitPct: 25,
  paperRequired: true,
  killSwitchEnabled: true,
  autoTpsl: true,
} as const;

/**
 * Policy sized for $10 total with $5 hard reserve.
 * Deployable = $5 across opportunity/trading sleeves.
 */
export const MICRO_POLICY: CapitalPolicy = {
  reservePct: 50, // $5 of $10
  autoBuyPct: 10,
  liquidityPct: 0,
  tradingPct: 15,
  opportunityPct: 25,
};

export function microMaxEntry(equityUsd: number): number {
  const deployable = Math.max(0, equityUsd - MICRO_STRATEGY.reserveUsd);
  return Math.min(MICRO_STRATEGY.maxPerTradeUsd, deployable);
}

export function microReachedTarget(equityUsd: number): boolean {
  return equityUsd >= MICRO_STRATEGY.targetEquityUsd;
}
