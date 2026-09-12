"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredMode, setStoredMode, TradingMode } from "@/lib/mode";

export function useTradingMode() {
  const [mode, setModeState] = useState<TradingMode>("paper");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setModeState(getStoredMode());
    setReady(true);
  }, []);

  const setMode = useCallback((m: TradingMode) => {
    setStoredMode(m);
    setModeState(m);
  }, []);

  const isPaper = mode === "paper";
  const isLive = mode === "live";

  return { mode, setMode, isPaper, isLive, ready };
}
