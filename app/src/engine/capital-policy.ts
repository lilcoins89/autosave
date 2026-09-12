import { CapitalPolicy, DEFAULT_POLICY } from "./types";

export interface AllocationSnapshot {
  totalUsd: number;
  reserveUsd: number;
  autoBuyUsd: number;
  liquidityUsd: number;
  tradingUsd: number;
  opportunityUsd: number;
}

export function normalizePolicy(p: Partial<CapitalPolicy>): CapitalPolicy {
  const base = { ...DEFAULT_POLICY, ...p };
  const sum =
    base.reservePct +
    base.autoBuyPct +
    base.liquidityPct +
    base.tradingPct +
    base.opportunityPct;
  if (sum <= 0) return DEFAULT_POLICY;
  // Normalize to 100
  const s = 100 / sum;
  return {
    reservePct: round(base.reservePct * s),
    autoBuyPct: round(base.autoBuyPct * s),
    liquidityPct: round(base.liquidityPct * s),
    tradingPct: round(base.tradingPct * s),
    opportunityPct: round(base.opportunityPct * s),
  };
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

export function allocate(totalUsd: number, policy: CapitalPolicy): AllocationSnapshot {
  const p = normalizePolicy(policy);
  return {
    totalUsd,
    reserveUsd: (totalUsd * p.reservePct) / 100,
    autoBuyUsd: (totalUsd * p.autoBuyPct) / 100,
    liquidityUsd: (totalUsd * p.liquidityPct) / 100,
    tradingUsd: (totalUsd * p.tradingPct) / 100,
    opportunityUsd: (totalUsd * p.opportunityPct) / 100,
  };
}

/** Max USD the Opportunity / AutoBuy sleeves can deploy for a single entry */
export function maxEntryUsd(
  totalUsd: number,
  policy: CapitalPolicy,
  maxPositionPct: number,
  sleeve: "opportunity" | "autoBuy" | "trading" = "opportunity"
): number {
  const a = allocate(totalUsd, policy);
  const sleeveUsd =
    sleeve === "opportunity"
      ? a.opportunityUsd
      : sleeve === "autoBuy"
      ? a.autoBuyUsd
      : a.tradingUsd;
  const hardCap = (totalUsd * maxPositionPct) / 100;
  return Math.max(0, Math.min(sleeveUsd, hardCap));
}
