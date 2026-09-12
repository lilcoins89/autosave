/** Core AURA engine types — Solana-only */

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export interface CapitalPolicy {
  reservePct: number;
  autoBuyPct: number;
  liquidityPct: number;
  tradingPct: number;
  opportunityPct: number;
}

export interface RiskProfileConfig {
  id: RiskProfile;
  label: string;
  minScore: number;
  minLiquidityUsd: number;
  maxPositionPct: number;
  maxDailyLossPct: number;
  defaultStopLossPct: number;
  defaultTakeProfitPct: number;
  maxSlippageBps: number;
  maxPriceImpactPct: number;
  requireRevokedAuthorities: boolean;
}

export const RISK_PROFILES: Record<RiskProfile, RiskProfileConfig> = {
  conservative: {
    id: "conservative",
    label: "Conservative",
    minScore: 80,
    minLiquidityUsd: 150_000,
    maxPositionPct: 2,
    maxDailyLossPct: 2,
    defaultStopLossPct: 4,
    defaultTakeProfitPct: 12,
    maxSlippageBps: 50,
    maxPriceImpactPct: 0.8,
    requireRevokedAuthorities: true,
  },
  balanced: {
    id: "balanced",
    label: "Balanced",
    minScore: 70,
    minLiquidityUsd: 50_000,
    maxPositionPct: 3,
    maxDailyLossPct: 5,
    defaultStopLossPct: 6,
    defaultTakeProfitPct: 18,
    maxSlippageBps: 100,
    maxPriceImpactPct: 1.5,
    requireRevokedAuthorities: true,
  },
  aggressive: {
    id: "aggressive",
    label: "Aggressive",
    minScore: 60,
    minLiquidityUsd: 25_000,
    maxPositionPct: 5,
    maxDailyLossPct: 10,
    defaultStopLossPct: 10,
    defaultTakeProfitPct: 30,
    maxSlippageBps: 150,
    maxPriceImpactPct: 2.5,
    requireRevokedAuthorities: false,
  },
};

export const DEFAULT_POLICY: CapitalPolicy = {
  reservePct: 40,
  autoBuyPct: 25,
  liquidityPct: 20,
  tradingPct: 10,
  opportunityPct: 5,
};

export interface DetectedPool {
  id: string;
  poolId: string;
  baseMint: string;
  quoteMint: string;
  symbol: string;
  liquidityUsd: number;
  volumeHintUsd: number;
  ageSeconds: number;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  lpBurnedHint: boolean;
  holdersHint: number;
  detectedAt: number;
  source: "raydium_listener" | "monitor";
}

export type WrongActivity =
  | "liquidity_drain"
  | "authority_restored"
  | "holder_dump"
  | "price_collapse"
  | "score_collapse"
  | "manual";

export interface EngineEvent {
  id: string;
  type:
    | "pool_detected"
    | "filtered_out"
    | "scored"
    | "entry"
    | "tp_hit"
    | "sl_hit"
    | "wrong_activity_close"
    | "reinvest"
    | "rebalance"
    | "info";
  message: string;
  ts: number;
  meta?: Record<string, unknown>;
}
