"use client";

import { useEffect, useState } from "react";
import { getNetwork } from "@/lib/rpc";

type Status = {
  ok: boolean;
  network: string;
  slot?: number;
  balanceSol?: number;
  latencyMs?: number;
  error?: string;
};

export function SolanaStatusCard({ address }: { address?: string }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/solana/health${address ? `?address=${encodeURIComponent(address)}` : ""}`, { signal: controller.signal })
      .then((response) => response.json())
      .then(setStatus)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus({ ok: false, network: getNetwork(), error: "Unable to reach Solana RPC" });
      });

    return () => controller.abort();
  }, [address]);

  return (
    <section className="rounded-2xl border border-[#2d2413] bg-[#110e08] p-4" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#bda36a]">Solana connectivity</p>
          <p className="mt-1 text-sm font-semibold text-[#f8e7b4]">{status?.ok ? "RPC healthy" : status ? "RPC degraded" : "Checking network…"}</p>
        </div>
        <span className={`size-2 rounded-full ${status?.ok ? "bg-[#e7b94d]" : "bg-[#7f5d2c]"}`} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#a99a7c]">
        <span>{status?.network ?? getNetwork()}</span>
        <span>{status?.latencyMs ? `${status.latencyMs}ms` : "—"}</span>
        <span className="text-right">{status?.slot ? `slot ${status.slot.toLocaleString()}` : status?.error ?? "—"}</span>
      </div>
    </section>
  );
}
