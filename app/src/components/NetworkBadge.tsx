"use client";

import { getNetwork, getNetworkLabel, getNetworkColor, isCustomRpc } from "@/lib/rpc";

export function NetworkBadge({ showRpcHint = false }: { showRpcHint?: boolean }) {
  const network = getNetwork();
  const label = getNetworkLabel(network);
  const colorClass = getNetworkColor(network);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {label}
      </span>
      {showRpcHint && !isCustomRpc() && (
        <span className="text-xs text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
          Public RPC
        </span>
      )}
      {showRpcHint && isCustomRpc() && (
        <span className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">
          Custom RPC
        </span>
      )}
    </div>
  );
}
