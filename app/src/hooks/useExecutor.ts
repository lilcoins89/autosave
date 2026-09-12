"use client";

import { useCallback, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createTransactionExecutor,
  ExecutorKind,
  ExecuteResult,
} from "@/execution";

const STORAGE_KEY = "autosave_executor_kind";
const FEE_KEY = "autosave_executor_fee";

function loadKind(): ExecutorKind {
  if (typeof window === "undefined") return "default";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "warp" || v === "jito" || v === "default") return v;
  return "default";
}

function loadFee(): number {
  if (typeof window === "undefined") return 0.001;
  const v = Number(localStorage.getItem(FEE_KEY));
  return Number.isFinite(v) && v >= 0.0001 ? v : 0.001;
}

/**
 * Hook that exposes Warp-style pluggable execution.
 */
export function useExecutor() {
  const { connection } = useConnection();
  const { signTransaction } = useWallet();

  const [kind, setKindState] = useState<ExecutorKind>(loadKind);
  const [feeSol, setFeeSolState] = useState<number>(loadFee);

  const setKind = useCallback((k: ExecutorKind) => {
    localStorage.setItem(STORAGE_KEY, k);
    setKindState(k);
  }, []);

  const setFeeSol = useCallback((f: number) => {
    const v = Math.max(0.0001, f);
    localStorage.setItem(FEE_KEY, String(v));
    setFeeSolState(v);
  }, []);

  const executor = useMemo(
    () =>
      createTransactionExecutor({
        connection,
        kind,
        feeSol,
      }),
    [connection, kind, feeSol]
  );

  const execute = useCallback(
    async (tx: VersionedTransaction): Promise<ExecuteResult> => {
      if (!signTransaction) {
        return {
          confirmed: false,
          error: "Wallet does not support signTransaction",
          executor: kind,
        };
      }

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");

      // Ensure tx uses fresh blockhash when possible is caller's responsibility;
      // we always pass latest for confirm / fee txs.
      return executor.executeAndConfirm(
        tx,
        latestBlockhash,
        async (t) => signTransaction(t)
      );
    },
    [connection, executor, signTransaction, kind]
  );

  return {
    kind,
    setKind,
    feeSol,
    setFeeSol,
    execute,
    executorLabel:
      kind === "warp"
        ? "Warp"
        : kind === "jito"
        ? "Jito"
        : "Default RPC",
  };
}
