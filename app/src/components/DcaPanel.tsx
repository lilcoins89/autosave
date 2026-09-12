"use client";

import { useState } from "react";
import { DcaCadence, DcaSchedule } from "@/hooks/useDcaSchedules";

interface Props {
  schedules: DcaSchedule[];
  onAdd: (s: {
    label: string;
    inputSymbol: "SOL" | "USDC";
    outputMint: string;
    outputSymbol: string;
    amountUsd: number;
    cadence: DcaCadence;
    maxTotalUsd: number;
  }) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onRunPaper: (id: string) => void;
  isPaper: boolean;
}

export function DcaPanel({
  schedules,
  onAdd,
  onToggle,
  onRemove,
  onRunPaper,
  isPaper,
}: Props) {
  const [label, setLabel] = useState("Weekly buy");
  const [amount, setAmount] = useState(25);
  const [cadence, setCadence] = useState<DcaCadence>("weekly");
  const [maxTotal, setMaxTotal] = useState(500);
  const [symbol, setSymbol] = useState("SOL");

  return (
    <section id="dca" className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-1">Automated DCA / Savings</h2>
      <p className="text-xs text-zinc-500 mb-4">
        Schedule recurring buys. In paper mode, runs are simulated. In live mode,
        execution uses Jupiter with safeguards.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <input
          className="field"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
        />
        <input
          className="field"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          placeholder="USD"
        />
        <select
          className="field"
          value={cadence}
          onChange={(e) => setCadence(e.target.value as DcaCadence)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button
          onClick={() =>
            onAdd({
              label,
              inputSymbol: "USDC",
              outputMint: "So11111111111111111111111111111111111111112",
              outputSymbol: symbol || "SOL",
              amountUsd: amount,
              cadence,
              maxTotalUsd: maxTotal,
            })
          }
          className="rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-3 py-2"
        >
          Add schedule
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          className="field flex-1"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Output symbol (e.g. SOL)"
        />
        <input
          className="field w-28"
          type="number"
          value={maxTotal}
          onChange={(e) => setMaxTotal(Number(e.target.value) || 0)}
          placeholder="Max $"
        />
      </div>

      <div className="space-y-2">
        {schedules.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-4">No schedules yet.</p>
        )}
        {schedules.map((s) => (
          <div
            key={s.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800"
          >
            <div>
              <div className="font-medium text-sm">{s.label}</div>
              <div className="text-xs text-zinc-500">
                ${s.amountUsd} → {s.outputSymbol} · {s.cadence} · spent $
                {s.spentUsd}/${s.maxTotalUsd}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onRunPaper(s.id)}
                className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-300"
              >
                {isPaper ? "Run paper" : "Run"}
              </button>
              <button
                onClick={() => onToggle(s.id)}
                className={`text-xs px-2 py-1 rounded-md ${
                  s.enabled
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {s.enabled ? "On" : "Off"}
              </button>
              <button
                onClick={() => onRemove(s.id)}
                className="text-xs text-red-400"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .field {
          background: #09090b;
          border: 1px solid #3f3f46;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #fafafa;
          width: 100%;
        }
      `}</style>
    </section>
  );
}
