"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getNetwork } from "@/lib/rpc";

export interface Position {
  id: string;
  symbol: string;
  mint: string;
  entryPriceUsd: number;
  quantity: number;
  markPriceUsd: number;
  stopLossPct: number | null;
  takeProfitPct: number | null;
  openedAt: string;
  source: "manual" | "sniper" | "copy" | "dca" | "paper";
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  side: "close";
  pnlUsd: number;
  reason: string;
  closedAt: string;
}

function storageKey(address: string, network: string) {
  return `autosave_positions_${network}_${address}`;
}

export function usePositions() {
  const { publicKey } = useWallet();
  const network = getNetwork();
  const address = publicKey?.toBase58() ?? null;

  const [positions, setPositions] = useState<Position[]>([]);
  const [closed, setClosed] = useState<ClosedTrade[]>([]);

  useEffect(() => {
    if (!address) {
      setPositions([]);
      setClosed([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(address, network));
      if (raw) {
        const parsed = JSON.parse(raw);
        setPositions(parsed.positions ?? []);
        setClosed(parsed.closed ?? []);
      } else {
        setPositions([]);
        setClosed([]);
      }
    } catch {
      setPositions([]);
      setClosed([]);
    }
  }, [address, network]);

  useEffect(() => {
    if (!address) return;
    try {
      localStorage.setItem(
        storageKey(address, network),
        JSON.stringify({ positions, closed })
      );
    } catch {
      /* ignore */
    }
  }, [address, network, positions, closed]);

  const openPosition = useCallback(
    (p: Omit<Position, "id" | "openedAt">) => {
      const pos: Position = {
        ...p,
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        openedAt: new Date().toISOString(),
      };
      setPositions((prev) => [pos, ...prev]);
      return pos;
    },
    []
  );

  const updateMark = useCallback((id: string, markPriceUsd: number) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, markPriceUsd } : p))
    );
  }, []);

  const closePosition = useCallback(
    (id: string, reason: string) => {
      setPositions((prev) => {
        const pos = prev.find((p) => p.id === id);
        if (!pos) return prev;
        const pnl =
          (pos.markPriceUsd - pos.entryPriceUsd) * pos.quantity;
        const trade: ClosedTrade = {
          id: `${Date.now()}_c`,
          symbol: pos.symbol,
          side: "close",
          pnlUsd: pnl,
          reason,
          closedAt: new Date().toISOString(),
        };
        setClosed((c) => [trade, ...c].slice(0, 100));
        return prev.filter((p) => p.id !== id);
      });
    },
    []
  );

  const setRiskRules = useCallback(
    (id: string, stopLossPct: number | null, takeProfitPct: number | null) => {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, stopLossPct, takeProfitPct } : p
        )
      );
    },
    []
  );

  /** Check TP/SL against marks; returns list of triggered closes */
  const evaluateRisk = useCallback(() => {
    const triggered: { id: string; reason: string; pnlUsd: number }[] = [];
    positions.forEach((p) => {
      if (p.entryPriceUsd <= 0) return;
      const changePct =
        ((p.markPriceUsd - p.entryPriceUsd) / p.entryPriceUsd) * 100;
      if (p.stopLossPct !== null && changePct <= -Math.abs(p.stopLossPct)) {
        triggered.push({
          id: p.id,
          reason: `Stop-loss hit (${changePct.toFixed(1)}%)`,
          pnlUsd: (p.markPriceUsd - p.entryPriceUsd) * p.quantity,
        });
      } else if (
        p.takeProfitPct !== null &&
        changePct >= Math.abs(p.takeProfitPct)
      ) {
        triggered.push({
          id: p.id,
          reason: `Take-profit hit (${changePct.toFixed(1)}%)`,
          pnlUsd: (p.markPriceUsd - p.entryPriceUsd) * p.quantity,
        });
      }
    });
    return triggered;
  }, [positions]);

  const unrealizedPnl = useMemo(
    () =>
      positions.reduce(
        (s, p) => s + (p.markPriceUsd - p.entryPriceUsd) * p.quantity,
        0
      ),
    [positions]
  );

  const realizedPnl = useMemo(
    () => closed.reduce((s, t) => s + t.pnlUsd, 0),
    [closed]
  );

  return {
    positions,
    closed,
    openPosition,
    updateMark,
    closePosition,
    setRiskRules,
    evaluateRisk,
    unrealizedPnl,
    realizedPnl,
  };
}
