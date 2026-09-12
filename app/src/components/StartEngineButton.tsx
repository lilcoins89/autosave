"use client";

import { MICRO_STRATEGY } from "@/lib/microStrategy";

interface Props {
  running: boolean;
  isPaper: boolean;
  equityUsd: number;
  onStart: () => void;
  onStop: () => void;
  onForcePaper: () => void;
  sessionId: string | null;
  connectionState: "idle" | "connecting" | "connected" | "error";
  connectionMessage?: string;
}

export function StartEngineButton({
  running,
  isPaper,
  equityUsd,
  onStart,
  onStop,
  onForcePaper,
  sessionId,
  connectionState,
  connectionMessage,
}: Props) {
  const progress = Math.min(
    100,
    (equityUsd / MICRO_STRATEGY.targetEquityUsd) * 100
  );
  const hitTarget = equityUsd >= MICRO_STRATEGY.targetEquityUsd;

  const handleClick = () => {
    if (running) {
      onStop();
      return;
    }
    // Paper mode is required before arming
    if (!isPaper) {
      onForcePaper();
    }
    onStart();
  };

  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/80 to-brand-500/10 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Big S button */}
        <button
          onClick={handleClick}
          className={`shrink-0 w-full sm:w-28 h-28 rounded-2xl font-black text-4xl tracking-tight transition shadow-lg active:scale-95 ${
            running
              ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
              : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/40"
          }`}
          title={running ? "Stop engine" : "Start trading (Paper)"}
        >
          {running ? "STOP" : connectionState === "connecting" ? "…" : "S"}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-bold">
              {running ? "Engine running" : "Press S to start trading"}
            </h2>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                isPaper
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}
            >
              {isPaper ? "Paper required · active" : "Switching to Paper…"}
            </span>
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${connectionState === "connected" ? "bg-emerald-500/15 text-emerald-300" : connectionState === "error" ? "bg-red-500/15 text-red-300" : "bg-zinc-500/15 text-zinc-300"}`}>
              {connectionState === "connected" ? "Backend connected" : connectionState === "connecting" ? "Connecting backend…" : connectionState === "error" ? "Backend blocked" : "Backend idle"}
            </span>
            {running && (
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 animate-pulse">
                Paper loop active
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-400 mb-3">
            Connects frontend → backend → AURA engine. Starts in <strong>paper mode</strong> only.
            Strategy arms automatically with the limits below.
          </p>
          {connectionMessage && <p className={`mb-3 text-xs ${connectionState === "error" ? "text-red-300" : "text-emerald-300"}`}>{connectionMessage}{sessionId ? ` Session ${sessionId.slice(0, 8)}.` : ""}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
            <Stat label="Starting capital" value={`$${MICRO_STRATEGY.startingCapitalUsd}`} />
            <Stat label="Max per trade" value={`$${MICRO_STRATEGY.maxPerTradeUsd}`} />
            <Stat label="Max loss / trade" value={`$${MICRO_STRATEGY.maxLossPerTradeUsd}`} />
            <Stat label="Reserve" value={`$${MICRO_STRATEGY.reserveUsd}`} />
            <Stat label="Target" value={`$${MICRO_STRATEGY.targetEquityUsd}`} />
            <Stat label="TP / SL" value="ON · Kill ON" />
          </div>

          {/* Progress toward $50 */}
          <div>
            <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
              <span>Compound progress</span>
              <span>
                ${equityUsd.toFixed(2)} / ${MICRO_STRATEGY.targetEquityUsd}
                {hitTarget ? " · TARGET HIT" : ""}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  hitTarget ? "bg-emerald-400" : "bg-brand-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-950/50 border border-zinc-800 px-2.5 py-1.5">
      <div className="text-zinc-500">{label}</div>
      <div className="font-semibold text-zinc-200">{value}</div>
    </div>
  );
}
