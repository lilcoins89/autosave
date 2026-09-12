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

  /** Demo: simulate automatic sniper decision */
  const simulateSniperTick = useCallback(() => {
    if (!sniper.enabled) {
      pushEvent("sniper_skip", "Sniper disabled · no action");
      return;
    }
    const score = 70 + Math.floor(Math.random() * 25);
    const liq = 40_000 + Math.floor(Math.random() * 200_000);
    if (score >= sniper.minScore && liq >= sniper.minLiquidityUsd) {
      pushEvent(
        "sniper_buy",
        `Auto-bought new token · score ${score} · liq $${(liq / 1000).toFixed(0)}k · max $${sniper.maxPositionUsd}`
      );
    } else {
      pushEvent(
        "sniper_skip",
        `Skipped · score ${score} / liq $${(liq / 1000).toFixed(0)}k (filters not met)`
      );
    }
  }, [sniper, pushEvent]);

  /** Demo: simulate copy of a followed wallet */
  const simulateCopyTick = useCallback(() => {
    if (!copy.enabled || copy.wallets.filter((w) => w.enabled).length === 0) {
      pushEvent("copy_skip", "Copy trading off or no wallets enabled");
      return;
    }
    const active = copy.wallets.filter((w) => w.enabled);
    const target = active[Math.floor(Math.random() * active.length)];
    const size = Math.min(
      copy.maxPerTradeUsd,
      (copy.maxCopyBudgetUsd * target.allocationPct) / 100
    );
    pushEvent(
      "copy_trade",
      `Copied ${target.label} · $${size.toFixed(0)} · ${target.address.slice(0, 4)}...${target.address.slice(-4)}`
    );
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
