"use client";

import {
  CapitalPolicy,
  EngineEvent,
  RiskProfile,
  RISK_PROFILES,
} from "@/engine/types";

interface Props {
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onEmergency: () => void;
  riskProfile: RiskProfile;
  setRiskProfile: (r: RiskProfile) => void;
  policy: CapitalPolicy;
  setPolicy: (p: CapitalPolicy) => void;
  autoSniper: boolean;
  setAutoSniper: (v: boolean) => void;
  autoReinvest: boolean;
  setAutoReinvest: (v: boolean) => void;
  reinvestPct: number;
  setReinvestPct: (n: number) => void;
  events: EngineEvent[];
}

export function AuraEnginePanel(props: Props) {
  const profile = RISK_PROFILES[props.riskProfile];

  return (
    <section className="rounded-2xl border border-brand-500/30 bg-gradient-to-b from-brand-500/10 to-zinc-900/40 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="text-brand-400">AURA</span> Engine
          </h2>
          <p className="text-xs text-zinc-500">
            Fast Raydium detection · filter · score · execute · TP/SL · wrong-activity
            close · reinvest
          </p>
        </div>
        <div className="flex gap-2">
          {!props.running ? (
            <button
              onClick={props.onStart}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold"
            >
              Start engine
            </button>
          ) : (
            <button
              onClick={props.onStop}
              className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold"
            >
              Stop
            </button>
          )}
          <button
            onClick={props.onEmergency}
            className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10"
          >
            Kill all
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="text-xs text-zinc-500">Risk profile</label>
          <select
            value={props.riskProfile}
            onChange={(e) => props.setRiskProfile(e.target.value as RiskProfile)}
            className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          >
            {Object.values(RISK_PROFILES).map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <Toggle
          label="Auto sniper"
          on={props.autoSniper}
          set={props.setAutoSniper}
        />
        <Toggle
          label="Auto reinvest profits"
          on={props.autoReinvest}
          set={props.setAutoReinvest}
        />
        <div>
          <label className="text-xs text-zinc-500">Reinvest %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={props.reinvestPct}
            onChange={(e) => props.setReinvestPct(Number(e.target.value) || 0)}
            className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 text-center text-xs">
        {(
          [
            ["Reserve", props.policy.reservePct],
            ["AutoBuy", props.policy.autoBuyPct],
            ["Liquidity", props.policy.liquidityPct],
            ["Trading", props.policy.tradingPct],
            ["Opportunity", props.policy.opportunityPct],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-2">
            <div className="text-zinc-500">{k}</div>
            <div className="font-semibold text-brand-300">{v}%</div>
          </div>
        ))}
      </div>

      <div className="text-[11px] text-zinc-500 mb-3 flex flex-wrap gap-x-3 gap-y-1">
        <span>Min score {profile.minScore}</span>
        <span>Min liq ${profile.minLiquidityUsd.toLocaleString()}</span>
        <span>SL {profile.defaultStopLossPct}% / TP {profile.defaultTakeProfitPct}%</span>
        <span>Slip {profile.maxSlippageBps} bps</span>
        <span>Impact {profile.maxPriceImpactPct}%</span>
        <span className={props.running ? "text-emerald-400" : "text-zinc-500"}>
          {props.running ? "● Engine live" : "○ Engine stopped"}
        </span>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs">
        {props.events.length === 0 && (
          <p className="text-zinc-500 text-center py-4">
            Start the engine to detect Raydium pools in real time.
          </p>
        )}
        {props.events.slice(0, 30).map((e) => (
          <div
            key={e.id}
            className="flex gap-2 px-2 py-1.5 rounded-lg bg-zinc-950/50 border border-zinc-800/80"
          >
            <span className="text-zinc-600 shrink-0 uppercase w-28 truncate">
              {e.type.replace(/_/g, " ")}
            </span>
            <span className="text-zinc-300">{e.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Toggle({
  label,
  on,
  set,
}: {
  label: string;
  on: boolean;
  set: (v: boolean) => void;
}) {
  return (
    <div className="flex items-end">
      <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer pb-2">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => set(e.target.checked)}
          className="rounded border-zinc-600"
        />
        {label}
      </label>
    </div>
  );
}
