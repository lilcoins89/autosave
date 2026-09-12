import { WrongActivity } from "./types";

export interface PositionHealthInput {
  entryPriceUsd: number;
  markPriceUsd: number;
  peakPriceUsd: number;
  liquidityUsdNow: number;
  liquidityUsdAtEntry: number;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  requireRevoked: boolean;
  /** 0-100 concentration of top wallet if known */
  topHolderPct?: number;
}

export interface WrongActivityResult {
  triggered: boolean;
  activity: WrongActivity | null;
  reason: string;
}

/**
 * Instant exit when something looks wrong.
 * Priority: authority > liquidity drain > dump > collapse.
 */
export function detectWrongActivity(
  p: PositionHealthInput
): WrongActivityResult {
  if (p.requireRevoked && (!p.mintAuthorityRevoked || !p.freezeAuthorityRevoked)) {
    return {
      triggered: true,
      activity: "authority_restored",
      reason: "Mint/freeze authority not safe — emergency close",
    };
  }

  // Liquidity drained >40%
  if (
    p.liquidityUsdAtEntry > 0 &&
    p.liquidityUsdNow < p.liquidityUsdAtEntry * 0.6
  ) {
    return {
      triggered: true,
      activity: "liquidity_drain",
      reason: `Liquidity drained ${(
        (1 - p.liquidityUsdNow / p.liquidityUsdAtEntry) *
        100
      ).toFixed(0)}% — close`,
    };
  }

  // Sharp dump from peak (>25%)
  if (p.peakPriceUsd > 0 && p.markPriceUsd < p.peakPriceUsd * 0.75) {
    return {
      triggered: true,
      activity: "holder_dump",
      reason: `Price -${(
        (1 - p.markPriceUsd / p.peakPriceUsd) *
        100
      ).toFixed(0)}% from peak — close`,
    };
  }

  // Collapse from entry (>20% without waiting for SL in extreme cases)
  if (p.entryPriceUsd > 0 && p.markPriceUsd < p.entryPriceUsd * 0.8) {
    return {
      triggered: true,
      activity: "price_collapse",
      reason: `Price collapsed ${(
        (1 - p.markPriceUsd / p.entryPriceUsd) *
        100
      ).toFixed(0)}% from entry — close`,
    };
  }

  if ((p.topHolderPct ?? 0) > 55) {
    return {
      triggered: true,
      activity: "holder_dump",
      reason: `Top holder ${p.topHolderPct}% — concentration risk close`,
    };
  }

  return { triggered: false, activity: null, reason: "" };
}
