"use client";

import { TradingMode } from "@/lib/mode";

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: TradingMode;
  onChange: (m: TradingMode) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-zinc-700 p-0.5 bg-zinc-900">
      <button
        onClick={() => onChange("paper")}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
          mode === "paper"
            ? "bg-cyan-500/20 text-cyan-300"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Paper
      </button>
      <button
        onClick={() => onChange("live")}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
          mode === "live"
            ? "bg-emerald-500/20 text-emerald-300"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Live
      </button>
    </div>
  );
}
