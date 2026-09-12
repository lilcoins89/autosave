/** More sophisticated opportunity scoring (0-100) */

export interface ScoreInputs {
  liquidityUsd: number;
  volume24hUsd: number;
  ageMinutes: number;
  holders: number;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  priceImpactPct?: number;
  topHolderPct?: number; // concentration risk
}

export interface ScoreBreakdown {
  liquidity: number;
  volume: number;
  momentum: number; // inverse age proxy for "fresh but not brand new"
  execution: number;
  risk: number; // lower is better in display; we invert into safety score
  total: number;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export function scoreOpportunity(i: ScoreInputs): ScoreBreakdown {
  // Liquidity: log-ish scale, strong above 50k, excellent above 200k
  const liquidity = clamp(
    i.liquidityUsd < 10_000
      ? 15
      : i.liquidityUsd < 50_000
      ? 45
      : i.liquidityUsd < 100_000
      ? 70
      : i.liquidityUsd < 250_000
      ? 85
      : 95
  );

  const volume = clamp(
    i.volume24hUsd < 5_000
      ? 20
      : i.volume24hUsd < 20_000
      ? 50
      : i.volume24hUsd < 50_000
      ? 70
      : i.volume24hUsd < 150_000
      ? 85
      : 95
  );

  // Prefer tokens that are new but not seconds-old (rug window)
  const momentum = clamp(
    i.ageMinutes < 5
      ? 35
      : i.ageMinutes < 30
      ? 80
      : i.ageMinutes < 120
      ? 90
      : i.ageMinutes < 360
      ? 70
      : 50
  );

  const impact = i.priceImpactPct ?? 0.5;
  const execution = clamp(
    impact > 5 ? 20 : impact > 2 ? 50 : impact > 1 ? 70 : impact > 0.3 ? 88 : 96
  );

  // Risk components (higher = safer, then we derive display risk)
  let safety = 50;
  if (i.mintAuthorityRevoked) safety += 20;
  else safety -= 25;
  if (i.freezeAuthorityRevoked) safety += 15;
  else safety -= 15;
  if ((i.topHolderPct ?? 30) > 40) safety -= 20;
  else if ((i.topHolderPct ?? 30) > 25) safety -= 10;
  if (i.holders < 50) safety -= 15;
  else if (i.holders > 300) safety += 10;
  safety = clamp(safety);

  const riskDisplay = clamp(100 - safety); // lower risk number = better

  const total = clamp(
    Math.round(
      liquidity * 0.25 +
        volume * 0.15 +
        momentum * 0.15 +
        execution * 0.2 +
        safety * 0.25
    )
  );

  return {
    liquidity,
    volume,
    momentum,
    execution,
    risk: riskDisplay,
    total,
  };
}
