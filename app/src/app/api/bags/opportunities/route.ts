import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getNetwork } from "@/lib/rpc";

type BagsCandidate = {
  mint?: string;
  address?: string;
  symbol?: string;
  name?: string;
  liquidityUsd?: number;
  volume24hUsd?: number;
  holders?: number;
  createdAt?: string;
  mintAuthorityRevoked?: boolean;
  freezeAuthorityRevoked?: boolean;
};

function normalize(value: unknown): BagsCandidate[] {
  if (Array.isArray(value)) return value as BagsCandidate[];
  if (value && typeof value === "object") {
    const record = value as { data?: unknown; tokens?: unknown; results?: unknown };
    return normalize(record.data ?? record.tokens ?? record.results);
  }
  return [];
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.BAGS_API_KEY;
  const baseUrl = process.env.BAGS_API_BASE_URL;
  const network = getNetwork(request.nextUrl.searchParams.get("network") ?? undefined);

  if (!apiKey || !baseUrl) {
    return NextResponse.json({
      source: "bags",
      configured: false,
      network: "connected",
      candidates: [],
      message: "Bags token intelligence is not configured yet.",
    });
  }

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/tokens/trending?network=${network}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!upstream.ok) throw new Error(`Bags returned ${upstream.status}`);
    const payload = await upstream.json();
    const candidates = normalize(payload).flatMap((item, index) => {
      const mint = item.mint ?? item.address;
      if (!mint) return [];
      try { new PublicKey(mint); } catch { return []; }
      const created = item.createdAt ? Date.parse(item.createdAt) : Date.now();
      const ageMinutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
      const liquidityUsd = Number(item.liquidityUsd ?? 0);
      const volume24hUsd = Number(item.volume24hUsd ?? 0);
      const score = Math.min(100, Math.round((liquidityUsd > 0 ? 35 : 0) + (volume24hUsd > liquidityUsd ? 30 : 15) + (item.mintAuthorityRevoked ? 18 : 0) + (item.freezeAuthorityRevoked ? 17 : 0)));
      return [{ id: `${network}-${mint}-${index}`, symbol: item.symbol ?? "NEW", name: item.name ?? "New token", mint, liquidityUsd, volume24hUsd, ageMinutes, holders: Number(item.holders ?? 0), mintAuthorityRevoked: Boolean(item.mintAuthorityRevoked), freezeAuthorityRevoked: Boolean(item.freezeAuthorityRevoked), score, source: "bags" as const, detectedAt: new Date(created).toISOString() }];
    });
    return NextResponse.json({ source: "bags", configured: true, network: "connected", candidates });
  } catch (error) {
    return NextResponse.json({ source: "bags", configured: true, network: "connected", candidates: [], message: error instanceof Error ? error.message : "Bags request failed" }, { status: 502 });
  }
}
