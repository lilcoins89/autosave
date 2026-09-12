"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getNetwork } from "@/lib/rpc";

export type DcaCadence = "daily" | "weekly" | "monthly";

export interface DcaSchedule {
  id: string;
  label: string;
  inputSymbol: "SOL" | "USDC";
  outputMint: string;
  outputSymbol: string;
  amountUsd: number;
  cadence: DcaCadence;
  maxTotalUsd: number;
  spentUsd: number;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

function storageKey(address: string, network: string) {
  return `autosave_dca_${network}_${address}`;
}

function nextRun(cadence: DcaCadence, from = new Date()): Date {
  const d = new Date(from);
  if (cadence === "daily") d.setDate(d.getDate() + 1);
  else if (cadence === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export function useDcaSchedules() {
  const { publicKey } = useWallet();
  const network = getNetwork();
  const address = publicKey?.toBase58() ?? null;
  const [schedules, setSchedules] = useState<DcaSchedule[]>([]);

  useEffect(() => {
    if (!address) {
      setSchedules([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(address, network));
      setSchedules(raw ? JSON.parse(raw) : []);
    } catch {
      setSchedules([]);
    }
  }, [address, network]);

  useEffect(() => {
    if (!address) return;
    try {
      localStorage.setItem(
        storageKey(address, network),
        JSON.stringify(schedules)
      );
    } catch {
      /* ignore */
    }
  }, [address, network, schedules]);

  const addSchedule = useCallback(
    (s: Omit<DcaSchedule, "id" | "spentUsd" | "lastRunAt" | "nextRunAt" | "enabled">) => {
      const row: DcaSchedule = {
        ...s,
        id: `${Date.now()}`,
        spentUsd: 0,
        enabled: true,
        lastRunAt: null,
        nextRunAt: nextRun(s.cadence).toISOString(),
      };
      setSchedules((prev) => [row, ...prev]);
    },
    []
  );

  const toggle = useCallback((id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  const remove = useCallback((id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /** Mark a schedule as executed (paper or live) */
  const markExecuted = useCallback((id: string, amountUsd: number) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const spent = s.spentUsd + amountUsd;
        return {
          ...s,
          spentUsd: spent,
          lastRunAt: new Date().toISOString(),
          nextRunAt: nextRun(s.cadence).toISOString(),
          enabled: spent < s.maxTotalUsd ? s.enabled : false,
        };
      })
    );
  }, []);

  return { schedules, addSchedule, toggle, remove, markExecuted };
}
