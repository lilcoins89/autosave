"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  AuraEngine,
  AuraEngineConfig,
  ManagedPosition,
} from "@/engine/aura-engine";
import {
  CapitalPolicy,
  DEFAULT_POLICY,
  EngineEvent,
  RiskProfile,
} from "@/engine/types";
import { RISK_PROFILES } from "@/engine/types";

export function useAuraEngine(opts: {
  equityUsd: number;
  paper: boolean;
  onEntry: AuraEngineConfig extends never ? never : (
    args: {
      symbol: string;
      mint: string;
      amountUsd: number;
      score: number;
      source: ManagedPosition["source"];
    }
  ) => void;
  onClose: (args: { positionId: string; reason: string; pnlUsd: number }) => void;
}) {
  const { connection } = useConnection();
  const engineRef = useRef<AuraEngine | null>(null);
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("balanced");
  const [policy, setPolicy] = useState<CapitalPolicy>(DEFAULT_POLICY);
  const [autoSniper, setAutoSniper] = useState(true);
  const [autoReinvest, setAutoReinvest] = useState(true);
  const [reinvestPct, setReinvestPct] = useState(50);

  const optsRef = useRef(opts);
  optsRef.current = opts;

  const ensureEngine = useCallback(() => {
    if (engineRef.current) return engineRef.current;
    const engine = new AuraEngine(
      {
        riskProfile,
        policy,
        equityUsd: optsRef.current.equityUsd || 1000,
        autoSniper,
        autoReinvest,
        reinvestPct,
        paper: optsRef.current.paper,
      },
      {
        onEntry: (a) => optsRef.current.onEntry(a),
        onClose: (a) => optsRef.current.onClose(a),
      }
    );
    engineRef.current = engine;
    return engine;
  }, [riskProfile, policy, autoSniper, autoReinvest, reinvestPct]);

  // Keep config in sync
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    e.updateConfig({
      riskProfile,
      policy,
      equityUsd: opts.equityUsd || 1000,
      autoSniper,
      autoReinvest,
      reinvestPct,
      paper: opts.paper,
    });
  }, [
    riskProfile,
    policy,
    opts.equityUsd,
    opts.paper,
    autoSniper,
    autoReinvest,
    reinvestPct,
  ]);

  // Poll events for UI
  useEffect(() => {
    const id = setInterval(() => {
      if (engineRef.current) setEvents(engineRef.current.getEventLog());
    }, 800);
    return () => clearInterval(id);
  }, []);

  const start = useCallback(() => {
    const engine = ensureEngine();
    engine.start(connection ?? null, { simulate: true });
    setRunning(true);
  }, [connection, ensureEngine]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setRunning(false);
  }, []);

  useEffect(() => () => engineRef.current?.stop(), []);

  const trackPosition = useCallback((p: ManagedPosition) => {
    ensureEngine().trackPosition(p);
  }, [ensureEngine]);

  const emergencyCloseAll = useCallback(() => {
    engineRef.current?.emergencyCloseAll();
  }, []);

  const profile = RISK_PROFILES[riskProfile];

  return {
    running,
    start,
    stop,
    events,
    riskProfile,
    setRiskProfile,
    policy,
    setPolicy,
    autoSniper,
    setAutoSniper,
    autoReinvest,
    setAutoReinvest,
    reinvestPct,
    setReinvestPct,
    profile,
    trackPosition,
    emergencyCloseAll,
  };
}
