"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getNetwork } from "@/lib/rpc";

export type PnLSide = "gain" | "loss";

export interface PnLEvent {
  id: string;
  side: PnLSide;
  amountUsd: number; // always positive; side determines sign
  reason: string;
  timestamp: Date;
  network: string;
}

export interface PortfolioLedger {
  /** Live on-chain starting snapshot (SOL*price + USDC) when first available */
  startingEquityUsd: number | null;
  /** Sum of gains (+) and losses (-) */
  realizedPnlUsd: number;
  /** startingEquity + realizedPnl */
  equityUsd: number | null;
  events: PnLEvent[];
  recordGain: (amountUsd: number, reason: string) => void;
  recordLoss: (amountUsd: number, reason: string) => void;
  resetLedger: () => void;
}

const STORAGE_KEY_PREFIX = "autosave_ledger_v1_";

function storageKey(address: string, network: string) {
  return `${STORAGE_KEY_PREFIX}${network}_${address}`;
}

interface StoredLedger {
  startingEquityUsd: number;
  events: Array<{
    id: string;
    side: PnLSide;
    amountUsd: number;
    reason: string;
    timestamp: string;
    network: string;
  }>;
}

export function usePortfolioLedger(
  liveEquityUsd: number | null,
  priceReady: boolean
): PortfolioLedger {
  const { publicKey } = useWallet();
  const network = getNetwork();
  const address = publicKey?.toBase58() ?? null;

  const [startingEquityUsd, setStartingEquityUsd] = useState<number | null>(null);
  const [events, setEvents] = useState<PnLEvent[]>([]);

  // Load from localStorage when wallet/network changes
  useEffect(() => {
    if (!address) {
      setStartingEquityUsd(null);
      setEvents([]);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey(address, network));
      if (raw) {
        const parsed: StoredLedger = JSON.parse(raw);
        setStartingEquityUsd(parsed.startingEquityUsd);
        setEvents(
          (parsed.events || []).map((e) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          }))
        );
      } else {
        setStartingEquityUsd(null);
        setEvents([]);
      }
    } catch {
      setStartingEquityUsd(null);
      setEvents([]);
    }
  }, [address, network]);

  // Snapshot starting equity once we have a live value and no prior snapshot
  useEffect(() => {
    if (!address || !priceReady) return;
    if (startingEquityUsd !== null) return;
    if (liveEquityUsd === null || Number.isNaN(liveEquityUsd)) return;

    setStartingEquityUsd(liveEquityUsd);
  }, [address, priceReady, liveEquityUsd, startingEquityUsd]);

  // Persist
  useEffect(() => {
    if (!address || startingEquityUsd === null) return;

    const payload: StoredLedger = {
      startingEquityUsd,
      events: events.map((e) => ({
        ...e,
        timestamp: e.timestamp.toISOString(),
      })),
    };
    try {
      localStorage.setItem(storageKey(address, network), JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }
  }, [address, network, startingEquityUsd, events]);

  const realizedPnlUsd = useMemo(() => {
    return events.reduce((sum, e) => {
      return sum + (e.side === "gain" ? e.amountUsd : -e.amountUsd);
    }, 0);
  }, [events]);

  const equityUsd = useMemo(() => {
    if (startingEquityUsd === null) return liveEquityUsd;
    return startingEquityUsd + realizedPnlUsd;
  }, [startingEquityUsd, realizedPnlUsd, liveEquityUsd]);

  const pushEvent = useCallback(
    (side: PnLSide, amountUsd: number, reason: string) => {
      if (!address) return;
      if (!Number.isFinite(amountUsd) || amountUsd <= 0) return;

      const event: PnLEvent = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        side,
        amountUsd,
        reason,
        timestamp: new Date(),
        network,
      };
      setEvents((prev) => [event, ...prev].slice(0, 100)); // keep last 100
    },
    [address, network]
  );

  const recordGain = useCallback(
    (amountUsd: number, reason: string) => pushEvent("gain", amountUsd, reason),
    [pushEvent]
  );

  const recordLoss = useCallback(
    (amountUsd: number, reason: string) => pushEvent("loss", amountUsd, reason),
    [pushEvent]
  );

  const resetLedger = useCallback(() => {
    if (!address) return;
    try {
      localStorage.removeItem(storageKey(address, network));
    } catch {
      /* ignore */
    }
    setEvents([]);
    // Re-snapshot from current live equity on next tick
    setStartingEquityUsd(liveEquityUsd);
  }, [address, network, liveEquityUsd]);

  return {
    startingEquityUsd,
    realizedPnlUsd,
    equityUsd,
    events,
    recordGain,
    recordLoss,
    resetLedger,
  };
}
