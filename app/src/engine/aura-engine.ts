/**
 * AURA Engine — orchestrates:
 * fast Raydium detection → token filter → AI score → size via capital policy
 * → execute (paper/live) → TP/SL + wrong-activity auto-close → reinvest
 */

import { scoreOpportunity } from "@/lib/scoring";
import { RaydiumListener } from "./raydium-listener";
import { filterPool } from "./token-filter";
import { detectWrongActivity } from "./wrong-activity";
import {
  allocate,
  maxEntryUsd,
  normalizePolicy,
} from "./capital-policy";
import {
  CapitalPolicy,
  DEFAULT_POLICY,
  DetectedPool,
  EngineEvent,
  RISK_PROFILES,
  RiskProfile,
  RiskProfileConfig,
} from "./types";
import { Connection } from "@solana/web3.js";

export interface ManagedPosition {
  id: string;
  symbol: string;
  mint: string;
  entryPriceUsd: number;
  markPriceUsd: number;
  peakPriceUsd: number;
  quantity: number;
  stopLossPct: number;
  takeProfitPct: number;
  liquidityUsdAtEntry: number;
  liquidityUsdNow: number;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  openedAt: number;
  source: "sniper" | "dca" | "copy" | "reinvest" | "paper";
}

export interface AuraEngineConfig {
  riskProfile: RiskProfile;
  policy: CapitalPolicy;
  equityUsd: number;
  autoSniper: boolean;
  autoReinvest: boolean;
  reinvestPct: number; // % of profits to redeploy
  paper: boolean;
}

export type EntryHandler = (args: {
  symbol: string;
  mint: string;
  amountUsd: number;
  score: number;
  source: ManagedPosition["source"];
}) => Promise<void> | void;

export type CloseHandler = (args: {
  positionId: string;
  reason: string;
  pnlUsd: number;
}) => void;

export class AuraEngine {
  private listener: RaydiumListener | null = null;
  private positions = new Map<string, ManagedPosition>();
  private events: EngineEvent[] = [];
  private config: AuraEngineConfig;
  private onEntry: EntryHandler;
  private onClose: CloseHandler;
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private dailyLossUsd = 0;
  private dayKey = "";

  constructor(
    config: AuraEngineConfig,
    handlers: { onEntry: EntryHandler; onClose: CloseHandler }
  ) {
    this.config = {
      ...config,
      policy: normalizePolicy(config.policy),
    };
    this.onEntry = handlers.onEntry;
    this.onClose = handlers.onClose;
  }

  get profile(): RiskProfileConfig {
    return RISK_PROFILES[this.config.riskProfile];
  }

  getEventLog(): EngineEvent[] {
    return this.events.slice(0, 100);
  }

  getPositions(): ManagedPosition[] {
    return Array.from(this.positions.values());
  }

  updateConfig(patch: Partial<AuraEngineConfig>) {
    this.config = {
      ...this.config,
      ...patch,
      policy: normalizePolicy(patch.policy ?? this.config.policy),
    };
  }

  private push(type: EngineEvent["type"], message: string, meta?: Record<string, unknown>) {
    this.events.unshift({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      message,
      ts: Date.now(),
      meta,
    });
    if (this.events.length > 150) this.events.length = 150;
  }

  private resetDailyIfNeeded() {
    const key = new Date().toISOString().slice(0, 10);
    if (key !== this.dayKey) {
      this.dayKey = key;
      this.dailyLossUsd = 0;
    }
  }

  start(connection: Connection | null, opts?: { simulate?: boolean }) {
    this.stop();
    this.listener = new RaydiumListener(connection, (pool) =>
      this.handlePool(pool)
    );
    this.listener.start({
      simulate: opts?.simulate ?? true,
      intervalMs: 2200,
    });
    // Health / TP-SL / wrong-activity loop — aggressive cadence
    this.healthTimer = setInterval(() => this.tickHealth(), 1500);
    this.push("info", "AURA engine started · fast Raydium detection armed");
  }

  stop() {
    this.listener?.stop();
    this.listener = null;
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
  }

  /** Register an external position (from UI / paper fill) into engine management */
  trackPosition(p: ManagedPosition) {
    this.positions.set(p.id, p);
  }

  updateMark(id: string, mark: number, liquidityNow?: number) {
    const p = this.positions.get(id);
    if (!p) return;
    p.markPriceUsd = mark;
    p.peakPriceUsd = Math.max(p.peakPriceUsd, mark);
    if (liquidityNow !== undefined) p.liquidityUsdNow = liquidityNow;
  }

  private async handlePool(pool: DetectedPool) {
    this.push("pool_detected", `${pool.symbol} detected · liq $${pool.liquidityUsd.toFixed(0)}`, {
      poolId: pool.poolId,
      source: pool.source,
    });

    if (!this.config.autoSniper) return;

    const profile = this.profile;
    const filtered = filterPool(pool, profile);
    if (!filtered.pass) {
      this.push("filtered_out", `${pool.symbol} filtered: ${filtered.reasons[0]}`, {
        reasons: filtered.reasons,
      });
      return;
    }

    const breakdown = scoreOpportunity({
      liquidityUsd: pool.liquidityUsd,
      volume24hUsd: pool.volumeHintUsd,
      ageMinutes: pool.ageSeconds / 60,
      holders: pool.holdersHint,
      mintAuthorityRevoked: pool.mintAuthorityRevoked,
      freezeAuthorityRevoked: pool.freezeAuthorityRevoked,
    });

    this.push("scored", `${pool.symbol} score ${breakdown.total}`, {
      score: breakdown,
    });

    if (breakdown.total < profile.minScore) {
      this.push("filtered_out", `${pool.symbol} score ${breakdown.total} < ${profile.minScore}`);
      return;
    }

    this.resetDailyIfNeeded();
    const maxLoss =
      (this.config.equityUsd * profile.maxDailyLossPct) / 100;
    if (this.dailyLossUsd >= maxLoss) {
      this.push("filtered_out", "Daily loss limit reached — no new entries");
      return;
    }

    const size = maxEntryUsd(
      this.config.equityUsd,
      this.config.policy,
      profile.maxPositionPct,
      "opportunity"
    );

    if (size < 5) {
      this.push("filtered_out", "Opportunity sleeve too small for entry");
      return;
    }

    // Prevent stacking same symbol
    for (const p of this.positions.values()) {
      if (p.symbol === pool.symbol) {
        this.push("filtered_out", `Already in ${pool.symbol}`);
        return;
      }
    }

    this.push("entry", `Enter ${pool.symbol} ~$${size.toFixed(2)} score ${breakdown.total}`);

    await this.onEntry({
      symbol: pool.symbol,
      mint: pool.baseMint,
      amountUsd: size,
      score: breakdown.total,
      source: this.config.paper ? "paper" : "sniper",
    });
  }

  private tickHealth() {
    const profile = this.profile;
    const requireRevoked = profile.requireRevokedAuthorities;

    for (const p of this.positions.values()) {
      // Simulate mild mark movement in paper so TP/SL/wrong-activity can fire
      if (this.config.paper) {
        const jitter = 1 + (Math.random() - 0.48) * 0.04;
        p.markPriceUsd *= jitter;
        p.peakPriceUsd = Math.max(p.peakPriceUsd, p.markPriceUsd);
        // occasional liquidity stress
        if (Math.random() < 0.02) {
          p.liquidityUsdNow *= 0.5;
        }
      }

      const wrong = detectWrongActivity({
        entryPriceUsd: p.entryPriceUsd,
        markPriceUsd: p.markPriceUsd,
        peakPriceUsd: p.peakPriceUsd,
        liquidityUsdNow: p.liquidityUsdNow,
        liquidityUsdAtEntry: p.liquidityUsdAtEntry,
        mintAuthorityRevoked: p.mintAuthorityRevoked,
        freezeAuthorityRevoked: p.freezeAuthorityRevoked,
        requireRevoked,
      });

      if (wrong.triggered) {
        this.closePosition(p, wrong.reason, "wrong_activity_close");
        continue;
      }

      const changePct =
        ((p.markPriceUsd - p.entryPriceUsd) / p.entryPriceUsd) * 100;

      if (changePct <= -Math.abs(p.stopLossPct)) {
        this.closePosition(
          p,
          `Stop-loss ${changePct.toFixed(1)}%`,
          "sl_hit"
        );
        continue;
      }

      if (changePct >= Math.abs(p.takeProfitPct)) {
        this.closePosition(
          p,
          `Take-profit ${changePct.toFixed(1)}%`,
          "tp_hit"
        );
      }
    }
  }

  private closePosition(
    p: ManagedPosition,
    reason: string,
    type: EngineEvent["type"]
  ) {
    const pnl = (p.markPriceUsd - p.entryPriceUsd) * p.quantity;
    this.positions.delete(p.id);
    this.push(type, `${p.symbol}: ${reason} · PnL $${pnl.toFixed(2)}`, {
      pnl,
      symbol: p.symbol,
    });

    if (pnl < 0) {
      this.resetDailyIfNeeded();
      this.dailyLossUsd += Math.abs(pnl);
    }

    this.onClose({ positionId: p.id, reason, pnlUsd: pnl });

    // Automatic reinvestment of profits into opportunity sleeve
    if (this.config.autoReinvest && pnl > 0) {
      const redeploy = (pnl * this.config.reinvestPct) / 100;
      if (redeploy >= 5) {
        this.push(
          "reinvest",
          `Reinvest $${redeploy.toFixed(2)} (${this.config.reinvestPct}% of profit)`
        );
        // Size bump only — actual re-entry waits for next scored opportunity
        this.config.equityUsd += redeploy;
      }
    }
  }

  /** Manual force-close all (kill) */
  emergencyCloseAll() {
    for (const p of [...this.positions.values()]) {
      this.closePosition(p, "Emergency close", "wrong_activity_close");
    }
  }

  allocation() {
    return allocate(this.config.equityUsd, this.config.policy);
  }
}
