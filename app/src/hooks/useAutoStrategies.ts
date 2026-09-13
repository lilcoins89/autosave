"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getNetwork } from "@/lib/rpc";

export interface AutoSniperConfig {
  enabled: boolean;
  minScore: number;
  minLiquidityUsd: number;
  maxPositionUsd: number;
  useOpportunityReserveOnly: boolean;
  requireRevokedAuthorities: boolean;
}

export interface CopyWallet {
  id: string;
  address: string;
  label: string;
  allocationPct: number; // % of copy budget to mirror
  enabled: boolean;
}

export interface AutoCopyConfig {
  enabled: boolean;
  maxCopyBudgetUsd: number;
  maxPerTradeUsd: number;
  wallets: CopyWallet[];
}

export interface StrategyEvent {
  id: string;
  type: "sniper_buy" | "sniper_skip" | "copy_trade" | "copy_skip";
  detail: string;
  timestamp: Date;
  network: string;
}

const DEFAULT_SNIPER: AutoSniperConfig = {
  enabled: false,
  minScore: 75,
  minLiquidityUsd: 50_000,
  maxPositionUsd: 50,
  useOpportunityReserveOnly: true,
  requireRevokedAuthorities: true,
};

const DEFAULT_COPY: AutoCopyConfig = {
  enabled: false,
  maxCopyBudgetUsd: 200,
  maxPerTradeUsd: 40,
  wallets: [],
};

function key(prefix: string, address: string, network: string) {
  return `autosave_${prefix}_${network}_${address}`;
}

export function useAutoStrategies() {
  const { publicKey } = useWallet();
  const network = getNetwork();
  const address = publicKey?.toBase58() ?? null;

  const [sniper, setSniper] = useState<AutoSniperConfig>(DEFAULT_SNIPER);
  const [copy, setCopy] = useState<AutoCopyConfig>(DEFAULT_COPY);
  const [events, setEvents] = useState<StrategyEvent[]>([]);

  // Load
  useEffect(() => {
    if (!address) {
      setSniper(DEFAULT_SNIPER);
      setCopy(DEFAULT_COPY);
      setEvents([]);
      return;
    }
    try {
      const s = localStorage.getItem(key("sniper", address, network));
      const c = localStorage.getItem(key("copy", address, network));
      const e = localStorage.getItem(key("strategy_events", address, network));
      if (s) setSniper({ ...DEFAULT_SNIPER, ...JSON.parse(s) });
      if (c) setCopy({ ...DEFAULT_COPY, ...JSON.parse(c) });
      if (e) {
        setEvents(
          JSON.parse(e).map((x: StrategyEvent) => ({
            ...x,
            timestamp: new Date(x.timestamp),
          }))
        );
      }
    } catch {
      /* ignore */
    }
  }, [address, network]);

  // Persist
  useEffect(() => {
    if (!address) return;
    try {
      localStorage.setItem(key("sniper", address, network), JSON.stringify(sniper));
      localStorage.setItem(key("copy", address, network), JSON.stringify(copy));
      localStorage.setItem(
        key("strategy_events", address, network),
        JSON.stringify(
          events.slice(0, 50).map((e) => ({
            ...e,
            timestamp: e.timestamp.toISOString(),
          }))
        )
      );
    } catch {
      /* ignore */
    }
  }, [address, network, sniper, copy, events]);

  const pushEvent = useCallback(
    (type: StrategyEvent["type"], detail: string) => {
      const ev: StrategyEvent = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        detail,
        timestamp: new Date(),
        network,
      };
      setEvents((prev) => [ev, ...prev].slice(0, 50));
    },
    [network]
  );

  const updateSniper = useCallback((patch: Partial<AutoSniperConfig>) => {
    setSniper((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateCopy = useCallback((patch: Partial<AutoCopyConfig>) => {
    setCopy((prev) => ({ ...prev, ...patch }));
  }, []);

  const addCopyWallet = useCallback(
    (walletAddress: string, label: string, allocationPct: number) => {
      const w: CopyWallet = {
        id: `${Date.now()}`,
        address: walletAddress.trim(),
        label: label.trim() || "Trader",
        allocationPct,
        enabled: true,
      };
      setCopy((prev) => ({
        ...prev,
        wallets: [...prev.wallets, w],
      }));
    },
    []
  );

  const removeCopyWallet = useCallback((id: string) => {
    setCopy((prev) => ({
      ...prev,
      wallets: prev.wallets.filter((w) => w.id !== id),
    }));
  }, []);

  const toggleCopyWallet = useCallback((id: string) => {
    setCopy((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      ),
    }));
  }, []);

  const simulateSniperTick = useCallback(async () => {
    if (!sniper.enabled) {
      pushEvent("sniper_skip", "Sniper disabled · no action");
      return;
    }

    try {
      const response = await fetch("/api/bags/opportunities", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Token feed unavailable");
      const candidate = payload.candidates?.[0];
      if (!candidate) {
        pushEvent("sniper_skip", "No live token candidate passed the feed filters");
        return;
      }
      const score = Number(candidate.score ?? 0);
      const liquidity = Number(candidate.liquidityUsd ?? 0);
      if (score >= sniper.minScore && liquidity >= sniper.minLiquidityUsd) {
        pushEvent("sniper_buy", `Paper entry queued · ${candidate.symbol || candidate.mint} · score ${score} · liquidity $${(liquidity / 1000).toFixed(0)}k · max $${sniper.maxPositionUsd}`);
      } else {
        pushEvent("sniper_skip", `Skipped ${candidate.symbol || candidate.mint} · score ${score} / liquidity $${(liquidity / 1000).toFixed(0)}k`);
      }
    } catch (error) {
      pushEvent("sniper_skip", error instanceof Error ? error.message : "Token feed unavailable");
    }
  }, [sniper, pushEvent]);

  const simulateCopyTick = useCallback(() => {
    if (!copy.enabled || copy.wallets.filter((w) => w.enabled).length === 0) {
      pushEvent("copy_skip", "Copy trading off or no wallets enabled");
      return;
    }
    pushEvent("copy_skip", "Copy execution waits for a verified wallet activity event");
  }, [copy, pushEvent]);

  return {
    sniper,
    copy,
    events,
    updateSniper,
    updateCopy,
    addCopyWallet,
    removeCopyWallet,
    toggleCopyWallet,
    simulateSniperTick,
    simulateCopyTick,
  };
}
