"use client";

import { useCallback, useEffect, useState } from "react";
import { getNetwork } from "@/lib/rpc";

export interface TokenOpportunity {
  id: string;
  symbol: string;
  name: string;
  mint: string;
  liquidityUsd: number;
  volume24hUsd: number;
  ageMinutes: number;
  holders: number;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  score: number; // simple 0-100 from available signals
  source: "monitor";
  detectedAt: Date;
}

export interface OpportunityFilters {
  minLiquidityUsd: number;
  minScore: number;
  requireRevokedAuthorities: boolean;
}

const DEFAULT_FILTERS: OpportunityFilters = {
  minLiquidityUsd: 50_000, // "good liquidity only"
  minScore: 60,
  requireRevokedAuthorities: true,
};

/**
 * Generates realistic demo opportunities.
 * Replace the body of fetchOpportunities() with real Helius / Birdeye / indexer calls.
 */
function generateDemoOpportunities(network: string): TokenOpportunity[] {
  const now = Date.now();
  const base: Omit<TokenOpportunity, "id" | "detectedAt">[] = [
    {
      symbol: "AURA",
      name: "Aura Flow",
      mint: "Aura1111111111111111111111111111111111111",
      liquidityUsd: 186_000,
      volume24hUsd: 42_000,
      ageMinutes: 38,
      holders: 420,
      mintAuthorityRevoked: true,
      freezeAuthorityRevoked: true,
      score: 84,
      source: "monitor",
    },
    {
      symbol: "DEPTH",
      name: "Deep Liquidity",
      mint: "Depth222222222222222222222222222222222222",
      liquidityUsd: 92_500,
      volume24hUsd: 18_200,
      ageMinutes: 55,
      holders: 210,
      mintAuthorityRevoked: true,
      freezeAuthorityRevoked: true,
      score: 71,
      source: "monitor",
    },
    {
      symbol: "THIN",
      name: "Thin Book",
      mint: "Thin3333333333333333333333333333333333333",
      liquidityUsd: 12_400, // below default threshold — will be filtered out
      volume24hUsd: 9_800,
      ageMinutes: 12,
      holders: 89,
      mintAuthorityRevoked: false,
      freezeAuthorityRevoked: true,
      score: 41,
      source: "monitor",
    },
    {
      symbol: "SOLID",
      name: "Solid Pool",
      mint: "Solid444444444444444444444444444444444444",
      liquidityUsd: 310_000,
      volume24hUsd: 95_000,
      ageMinutes: 95,
      holders: 880,
      mintAuthorityRevoked: true,
      freezeAuthorityRevoked: true,
      score: 91,
      source: "monitor",
    },
    {
      symbol: "RISK",
      name: "Open Mint",
      mint: "Risk5555555555555555555555555555555555555",
      liquidityUsd: 75_000,
      volume24hUsd: 22_000,
      ageMinutes: 22,
      holders: 150,
      mintAuthorityRevoked: false, // will fail requireRevokedAuthorities
      freezeAuthorityRevoked: false,
      score: 55,
      source: "monitor",
    },
  ];

  // Slightly different set feel per network
  const prefix = network === "mainnet-beta" ? "" : network.slice(0, 3).toUpperCase() + "-";

  return base.map((t, i) => ({
    ...t,
    symbol: prefix ? `${prefix}${t.symbol}` : t.symbol,
    id: `${network}-${t.mint}-${i}`,
    detectedAt: new Date(now - t.ageMinutes * 60_000),
  }));
}

function applyFilters(
  list: TokenOpportunity[],
  filters: OpportunityFilters
): TokenOpportunity[] {
  return list
    .filter((t) => t.liquidityUsd >= filters.minLiquidityUsd)
    .filter((t) => t.score >= filters.minScore)
    .filter((t) =>
      filters.requireRevokedAuthorities
        ? t.mintAuthorityRevoked && t.freezeAuthorityRevoked
        : true
    )
    .sort((a, b) => b.score - a.score || b.liquidityUsd - a.liquidityUsd);
}

export function useTokenOpportunities(initialFilters?: Partial<OpportunityFilters>) {
  const [filters, setFilters] = useState<OpportunityFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [all, setAll] = useState<TokenOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with real data source:
      // - Helius webhooks / enhanced txs for new pools
      // - Birdeye / DexScreener / Jupiter token lists
      // - Custom indexer watching Raydium / Meteora / Orca pool creation
      const network = getNetwork();
      const raw = generateDemoOpportunities(network);

      // Simulate network latency
      await new Promise((r) => setTimeout(r, 400));

      setAll(raw);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
    const id = setInterval(fetchOpportunities, 45_000);
    return () => clearInterval(id);
  }, [fetchOpportunities]);

  const filtered = applyFilters(all, filters);

  return {
    opportunities: filtered,
    totalDetected: all.length,
    filters,
    setFilters,
    loading,
    error,
    lastUpdated,
    refetch: fetchOpportunities,
  };
}
