"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getNetwork } from "@/lib/rpc";

export type AuditKind =
  | "swap_quote"
  | "swap_submit"
  | "swap_success"
  | "swap_fail"
  | "paper_fill"
  | "dca_run"
  | "tp_sl"
  | "safety_block"
  | "mode_change"
  | "info";

export interface AuditEntry {
  id: string;
  kind: AuditKind;
  message: string;
  meta?: Record<string, unknown>;
  signature?: string;
  timestamp: string;
  network: string;
  mode: "paper" | "live";
}

function storageKey(address: string, network: string) {
  return `autosave_audit_${network}_${address}`;
}

export function useAuditTrail(mode: "paper" | "live") {
  const { publicKey } = useWallet();
  const network = getNetwork();
  const address = publicKey?.toBase58() ?? null;
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    if (!address) {
      setEntries([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(address, network));
      setEntries(raw ? JSON.parse(raw) : []);
    } catch {
      setEntries([]);
    }
  }, [address, network]);

  useEffect(() => {
    if (!address) return;
    try {
      localStorage.setItem(
        storageKey(address, network),
        JSON.stringify(entries.slice(0, 200))
      );
    } catch {
      /* ignore */
    }
  }, [address, network, entries]);

  const log = useCallback(
    (
      kind: AuditKind,
      message: string,
      meta?: Record<string, unknown>,
      signature?: string
    ) => {
      const entry: AuditEntry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        kind,
        message,
        meta,
        signature,
        timestamp: new Date().toISOString(),
        network,
        mode,
      };
      setEntries((prev) => [entry, ...prev].slice(0, 200));
    },
    [network, mode]
  );

  return { entries, log };
}
