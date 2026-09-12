"use client";

import { MICRO_START_PRESET } from "@/engine/presets";

interface Props {
  running: boolean;
  isPaper: boolean;
  onForcePaper: () => void;
  onStart: () => void;
  onStop: () => void;
  equityUsd: number;
  targetUsd: number;
}

export function StartTradingButton({
  running,
  isPaper,
  onForcePaper,
  onStart,
  onStop,
  equityUsd,
  targetUsd,
}: Props) {
  const p = MICRO_START_PRESET;
  const progress = Math.min(100, (equityUsd / targetUsd) * 100);

  const handleStart = () => {
    // Paper mode is mandatory for first run of this preset
    if (!isPaper) onForcePaper();
    onStart();
  };

  return (
    <section className="rounded-2xl border-2 border-brand-500/40 bg-gradient-to-br from-brand-600/20 via-zinc-900 to-zinc-950 p-4 sm:p-6 shadow-xl shadow-brand-900/20">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Giant S / Start control */}
        <button
          onClick={running ? onStop : handleStart}
          className={`shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl font-black text-3xl sm:text-4xl transition shadow-lg active:scale-95 ${
            running
              ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/40"
              : "bg-brand-600 hover:bg-brand-500 text-white shadow-brand-900/40"
          }`}
          title={running ? "Stop trading" : "Start trading"}
        >
          {running ? "■" : "S"}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg sm:text-xl font-bold">
              {running ? "Engine running" : "Start trading"}
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Paper required
            </span>
            {running && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 animate-pulse">
                Live loop
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mb-3">
            One click connects AURA + backend loop. Starts in{" "}
            <strong className="text-zinc-200">paper mode</strong> with your micro
            preset.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
            <Chip label="Start capital" value={`$${p.startingCapitalUsd}`} />
            <Chip label="Max / trade" value={`$${p.maxPerTradeUsd}`} />
            <Chip label="Max loss / trade" value={`$${p.maxLossPerTradeUsd}`} />
            <Chip label="Reserve" value={`$${p.reserveUsd}`} />
            <Chip label="Target" value={`$${p.targetEquityUsd}`} />
            <Chip label="TP / SL" value="ON" />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
              <span>Compound progress</span>
              <span>
                ${equityUsd.toFixed(2)} / ${targetUsd}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {!isPaper && !running && (
        <p className="text-xs text-amber-300 mt-3">
          Start will force <strong>Paper</strong> first. Switch to Live only after
          the paper path looks correct.
        </p>
      )}
    </section>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-950/70 border border-zinc-800 px-2 py-1.5">
      <div className="text-zinc-500">{label}</div>
      <div className="font-semibold text-zinc-100">{value}</div>
    </div>
  );
}
