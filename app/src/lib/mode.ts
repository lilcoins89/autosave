/** Global trading mode: paper (simulation) vs live (real funds) */

export type TradingMode = "paper" | "live";

const MODE_KEY = "autosave_trading_mode";

export function getStoredMode(): TradingMode {
  if (typeof window === "undefined") return "paper";
  const v = localStorage.getItem(MODE_KEY);
  return v === "live" ? "live" : "paper";
}

export function setStoredMode(mode: TradingMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODE_KEY, mode);
}
