/**
 * Preset micro-compound strategy
 * Starting $50 paper allocation with strict risk controls (paper-first).
 */

import { CapitalPolicy } from "@/engine/types";

export const MICRO_STRATEGY = {
  id: "paper_50",
  label: "Paper Desk $50",
  startingCapitalUsd: 50,
  maxPerTradeUsd: 5,
  maxLossPerTradeUsd: 1,
  targetEquityUsd: 50,
  reserveUsd: 25,
  /** Derived stop from $1 size and $0.20 max loss = 20% SL */
  stopLossPct: 20,
  takeProfitPct: 25,
  paperRequired: true,
  killSwitchEnabled: true,
  autoTpsl: true,
} as const;

/**
 * Policy sized for a $50 paper allocation with a $25 hard reserve.
 * Deployable = $25 across opportunity/trading sleeves.
 */
export const MICRO_POLICY: CapitalPolicy = {
  reservePct: 50, // $25 of $50
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
