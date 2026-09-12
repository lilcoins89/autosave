"use client";

import { isCustomRpc } from "@/lib/rpc";

export function NetworkBadge({ showRpcHint = false }: { showRpcHint?: boolean }) {
  const label = "Connected";
  const colorClass = "text-[#00E676] bg-[#00E676]/10 border-[#00E676]/20";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {label}
      </span>
      {showRpcHint && !isCustomRpc() && (
        <span className="text-xs text-[#9945FF] bg-[#9945FF]/10 border border-[#9945FF]/20 px-2.5 py-1 rounded-full">
          Secure RPC
        </span>
      )}
    </div>
  );
}
