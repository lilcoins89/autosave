import { DetectedPool, RiskProfileConfig } from "./types";

export interface FilterResult {
  pass: boolean;
  reasons: string[];
}

/**
 * Aggressive token filtering before any capital is risked.
 * Fast, synchronous checks on detected pool metadata.
 */
export function filterPool(
  pool: DetectedPool,
  profile: RiskProfileConfig
): FilterResult {
  const reasons: string[] = [];

  if (pool.liquidityUsd < profile.minLiquidityUsd) {
    reasons.push(
      `Liquidity $${pool.liquidityUsd.toFixed(0)} < min $${profile.minLiquidityUsd}`
    );
  }

  if (profile.requireRevokedAuthorities) {
    if (!pool.mintAuthorityRevoked) reasons.push("Mint authority not revoked");
    if (!pool.freezeAuthorityRevoked)
      reasons.push("Freeze authority not revoked");
  }

  // Brand-new pools under 8s are higher rug risk
  if (pool.ageSeconds < 8) {
    reasons.push(`Pool too new (${pool.ageSeconds}s)");
  }

  if (pool.holdersHint > 0 && pool.holdersHint < 30) {
    reasons.push(`Low holders (${pool.holdersHint})`);
  }

  // Prefer some LP burn signal when available
  if (profile.id !== "aggressive" && pool.lpBurnedHint === false) {
    reasons.push("LP not burned (hint)");
  }

  return { pass: reasons.length === 0, reasons };
}
