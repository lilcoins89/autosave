"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Navbar } from "@/components/Navbar";
import { NetworkBadge } from "@/components/NetworkBadge";
import { ModeToggle } from "@/components/ModeToggle";
import { OpportunityMonitor } from "@/components/OpportunityMonitor";
import { PortfolioEquity } from "@/components/PortfolioEquity";
import { AutoSniperPanel } from "@/components/AutoSniperPanel";
import { AutoCopyPanel } from "@/components/AutoCopyPanel";
import { StrategyActivity } from "@/components/StrategyActivity";
import { DcaPanel } from "@/components/DcaPanel";
import { PositionsPanel } from "@/components/PositionsPanel";
import { AuditTrailPanel } from "@/components/AuditTrailPanel";
import { ExecutorPanel } from "@/components/ExecutorPanel";
import { AuraEnginePanel } from "@/components/AuraEnginePanel";
import { StartEngineButton } from "@/components/StartEngineButton";
import { useSolanaBalances } from "@/hooks/useSolanaBalances";
import { usePortfolioLedger } from "@/hooks/usePortfolioLedger";
import { useAutoStrategies } from "@/hooks/useAutoStrategies";
import { useTradingMode } from "@/hooks/useTradingMode";
import { usePositions } from "@/hooks/usePositions";
import { useDcaSchedules } from "@/hooks/useDcaSchedules";
import { useAuditTrail } from "@/hooks/useAuditTrail";
import { useExecutor } from "@/hooks/useExecutor";
import { useAuraEngine } from "@/hooks/useAuraEngine";
import { getNetwork, getNetworkLabel, isCustomRpc } from "@/lib/rpc";
import {
  getJupiterQuote,
  assertSwapSafe,
  buildJupiterSwapTransaction,
  NATIVE_SOL_MINT,
  USDC_MINT_MAINNET,
  SwapGuardError,
} from "@/lib/jupiter";
import { withRetry } from "@/lib/retry";
import { VersionedTransaction } from "@solana/web3.js";
import {
  MICRO_STRATEGY,
  MICRO_POLICY,
  microMaxEntry,
  microReachedTarget,
} from "@/lib/microStrategy";

const SOL_PRICE_USD = 180;

export default function DashboardPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { sol, tokens, loading, error, lastUpdated, refetch } = useSolanaBalances();

  const network = getNetwork();
  const networkLabel = getNetworkLabel(network);
  const { mode, setMode, isPaper } = useTradingMode();
  const { entries: audit, log } = useAuditTrail(mode);
  const { kind, setKind, feeSol, setFeeSol, execute, executorLabel } = useExecutor();

  const usdc = tokens.find((t) => t.symbol === "USDC");
  const liveOnChainUsd =
    sol !== null ? (sol ?? 0) * SOL_PRICE_USD + (usdc?.uiAmount ?? 0) : null;

  const ledger = usePortfolioLedger(liveOnChainUsd, !loading && sol !== null);

  // Micro-strategy paper equity ($10 start)
  const [microActive, setMicroActive] = useState(false);
  const [microEquity, setMicroEquity] = useState(MICRO_STRATEGY.startingCapitalUsd);

  const {
    sniper,
    copy,
    events: strategyEvents,
    updateSniper,
    updateCopy,
    addCopyWallet,
    removeCopyWallet,
    toggleCopyWallet,
    simulateSniperTick,
    simulateCopyTick,
  } = useAutoStrategies();

  const {
    positions,
    closed,
    openPosition,
    updateMark,
    closePosition,
    setRiskRules,
    evaluateRisk,
    unrealizedPnl,
    realizedPnl,
  } = usePositions();

  const { schedules, addSchedule, toggle, remove, markExecuted } = useDcaSchedules();

  const displayEquity = microActive
    ? microEquity
    : ledger.equityUsd ?? liveOnChainUsd ?? 1000;

  const onEngineEntry = useCallback(
    (args: {
      symbol: string;
      mint: string;
      amountUsd: number;
      score: number;
      source: "sniper" | "dca" | "copy" | "reinvest" | "paper";
    }) => {
      // Hard cap max per trade at $1 when micro strategy is active
      const size = microActive
        ? Math.min(args.amountUsd, microMaxEntry(microEquity))
        : args.amountUsd;

      if (size < 0.5) {
        log("safety_block", "Entry skipped — size below minimum or reserve locked");
        return;
      }

      if (microActive && microReachedTarget(microEquity)) {
        log("safety_block", "Target $50 reached — no new entries");
        return;
      }

      const entry = SOL_PRICE_USD;
      openPosition({
        symbol: args.symbol,
        mint: args.mint,
        entryPriceUsd: entry,
        quantity: size / entry,
        markPriceUsd: entry,
        stopLossPct: MICRO_STRATEGY.stopLossPct,
        takeProfitPct: MICRO_STRATEGY.takeProfitPct,
        source: "paper",
      });
      log(
        "paper_fill",
        `S-strategy entry ${args.symbol} score ${args.score} $${size.toFixed(2)} (max loss $${MICRO_STRATEGY.maxLossPerTradeUsd})`
      );
    },
    [openPosition, log, microActive, microEquity]
  );

  const onEngineClose = useCallback(
    (args: { positionId: string; reason: string; pnlUsd: number }) => {
      closePosition(args.positionId, args.reason);

      // Cap loss per trade at $0.20 for micro strategy
      let pnl = args.pnlUsd;
      if (microActive && pnl < 0) {
        pnl = Math.max(pnl, -MICRO_STRATEGY.maxLossPerTradeUsd);
      }

      if (pnl >= 0) ledger.recordGain(pnl, args.reason);
      else ledger.recordLoss(Math.abs(pnl), args.reason);

      if (microActive) {
        setMicroEquity((e) => {
          const next = Math.max(MICRO_STRATEGY.reserveUsd, e + pnl);
          return next;
        });
      }

      log("tp_sl", args.reason, { pnlUsd: pnl });
    },
    [closePosition, ledger, log, microActive]
  );

  const aura = useAuraEngine({
    equityUsd: displayEquity,
    paper: true, // S button always runs paper-first
    onEntry: onEngineEntry,
    onClose: onEngineClose,
  });

  const handleStartS = useCallback(() => {
    // 1. Force paper mode
    setMode("paper");

    // 2. Arm micro capital policy & risk
    setMicroActive(true);
    setMicroEquity(MICRO_STRATEGY.startingCapitalUsd);
    aura.setPolicy(MICRO_POLICY);
    aura.setRiskProfile("balanced");
    aura.setAutoSniper(true);
    aura.setAutoReinvest(true);
    aura.setReinvestPct(50);

    // 3. Start engine (frontend → backend loop)
    aura.start();

    log("mode_change", "S pressed — Paper mode + micro strategy armed");
    log(
      "info",
      `Strategy: $${MICRO_STRATEGY.startingCapitalUsd} start · max $${MICRO_STRATEGY.maxPerTradeUsd}/trade · max loss $${MICRO_STRATEGY.maxLossPerTradeUsd} · reserve $${MICRO_STRATEGY.reserveUsd} · target $${MICRO_STRATEGY.targetEquityUsd} · TP/SL ON · Kill ON`
    );
  }, [aura, setMode, log]);

  const handleStopS = useCallback(() => {
    aura.stop();
    aura.emergencyCloseAll();
    log("info", "S stopped — engine halted + kill switch fired");
  }, [aura, log]);

  useEffect(() => {
    const id = setInterval(() => {
      const hits = evaluateRisk();
      hits.forEach((h) => {
        closePosition(h.id, h.reason);
        let pnl = h.pnlUsd;
        if (microActive && pnl < 0) {
          pnl = Math.max(pnl, -MICRO_STRATEGY.maxLossPerTradeUsd);
        }
        if (pnl >= 0) ledger.recordGain(pnl, h.reason);
        else ledger.recordLoss(Math.abs(pnl), h.reason);
        if (microActive) {
          setMicroEquity((e) => Math.max(MICRO_STRATEGY.reserveUsd, e + pnl));
        }
        log("tp_sl", h.reason, { pnlUsd: pnl });
      });
    }, 3000);
    return () => clearInterval(id);
  }, [evaluateRisk, closePosition, ledger, log, microActive]);

  // Auto-stop if target hit
  useEffect(() => {
    if (microActive && aura.running && microReachedTarget(microEquity)) {
      log("info", "Target $50 reached — stopping new risk");
      aura.stop();
    }
  }, [microActive, microEquity, aura, log]);

  async function executeBuy(opts: {
    symbol: string;
    mint: string;
    amountUsd: number;
    source: "manual" | "sniper" | "copy" | "dca" | "paper";
  }) {
    if (!publicKey) return;
    const maxSlippageBps = aura.profile.maxSlippageBps;
    const maxPriceImpactPct = aura.profile.maxPriceImpactPct;

    // S-strategy / paper path
    if (isPaper || microActive) {
      const size = microActive
        ? Math.min(opts.amountUsd, microMaxEntry(microEquity))
        : opts.amountUsd;
      openPosition({
        symbol: opts.symbol,
        mint: opts.mint,
        entryPriceUsd: SOL_PRICE_USD,
        quantity: size / SOL_PRICE_USD,
        markPriceUsd: SOL_PRICE_USD,
        stopLossPct: MICRO_STRATEGY.stopLossPct,
        takeProfitPct: MICRO_STRATEGY.takeProfitPct,
        source: "paper",
      });
      log("paper_fill", `Paper buy ${opts.symbol} ~$${size}`, opts);
      return;
    }

    try {
      log("swap_quote", `Quoting ${opts.symbol} via ${executorLabel}`);
      const amountRaw = Math.round(opts.amountUsd * 1e6);
      const quote = await withRetry(
        () =>
          getJupiterQuote({
            inputMint: USDC_MINT_MAINNET,
            outputMint: opts.mint === "SOL" ? NATIVE_SOL_MINT : opts.mint,
            amount: amountRaw,
            slippageBps: maxSlippageBps,
          }),
        { retries: 2, onRetry: (n) => log("info", `Quote retry ${n}`) }
      );
      assertSwapSafe(quote, maxPriceImpactPct);
      const swapTxB64 = await buildJupiterSwapTransaction({
        quoteRaw: quote.raw,
        userPublicKey: publicKey.toBase58(),
      });
      const tx = VersionedTransaction.deserialize(Buffer.from(swapTxB64, "base64"));
      log("swap_submit", `Submitting via ${executorLabel}`);

      if (kind === "warp" || kind === "jito") {
        const result = await execute(tx);
        if (!result.confirmed) {
          log("swap_fail", result.error ?? "Executor failed", opts);
          return;
        }
        openPosition({
          symbol: opts.symbol,
          mint: opts.mint,
          entryPriceUsd: SOL_PRICE_USD,
          quantity: opts.amountUsd / SOL_PRICE_USD,
          markPriceUsd: SOL_PRICE_USD,
          stopLossPct: MICRO_STRATEGY.stopLossPct,
          takeProfitPct: MICRO_STRATEGY.takeProfitPct,
          source: opts.source,
        });
        log("swap_success", `Confirmed via ${executorLabel}`, opts, result.signature);
        return;
      }

      const sig = await withRetry(
        async () => {
          const s = await sendTransaction(tx, connection, { maxRetries: 2, skipPreflight: false });
          await connection.confirmTransaction(s, "confirmed");
          return s;
        },
        { retries: 2, onRetry: (n) => log("info", `Send retry ${n}`) }
      );
      openPosition({
        symbol: opts.symbol,
        mint: opts.mint,
        entryPriceUsd: SOL_PRICE_USD,
        quantity: opts.amountUsd / SOL_PRICE_USD,
        markPriceUsd: SOL_PRICE_USD,
        stopLossPct: MICRO_STRATEGY.stopLossPct,
        takeProfitPct: MICRO_STRATEGY.takeProfitPct,
        source: opts.source,
      });
      log("swap_success", `Swap confirmed`, opts, sig);
    } catch (e) {
      const msg = e instanceof SwapGuardError ? e.message : String(e);
      log("swap_fail", msg, opts);
      if (e instanceof SwapGuardError) log("safety_block", msg);
    }
  }

  function handleDcaRun(id: string) {
    const s = schedules.find((x) => x.id === id);
    if (!s || !s.enabled) return;
    if (s.spentUsd + s.amountUsd > s.maxTotalUsd) {
      log("safety_block", `DCA ${s.label} would exceed max total`);
      return;
    }
    executeBuy({
      symbol: s.outputSymbol,
      mint: s.outputMint,
      amountUsd: s.amountUsd,
      source: "dca",
    });
    markExecuted(id, s.amountUsd);
    log("dca_run", `DCA ran ${s.label} $${s.amountUsd}`, { id });
  }

  if (!connected) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-center">Connect your Solana wallet</h1>
          <p className="text-zinc-400 text-center max-w-md text-sm">
            Then press <strong className="text-emerald-400">S</strong> to start paper trading.
          </p>
          <NetworkBadge showRpcHint />
          <WalletMultiButton />
        </div>
      </>
    );
  }

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";
  const pnl = ledger.realizedPnlUsd;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Portfolio</h1>
            <p className="text-zinc-500 text-xs sm:text-sm">
              {shortAddress}
              {lastUpdated && ` · ${lastUpdated.toLocaleTimeString()}`}
              {aura.running && " · AURA live"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ModeToggle mode={mode} onChange={setMode} />
            <NetworkBadge showRpcHint />
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? "…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* PRIMARY: S start button */}
        <div className="mb-6">
          <StartEngineButton
            running={aura.running}
            isPaper={isPaper}
            equityUsd={microActive ? microEquity : displayEquity}
            onStart={handleStartS}
            onStop={handleStopS}
            onForcePaper={() => setMode("paper")}
          />
        </div>

        {isPaper ? (
          <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs sm:text-sm text-cyan-200">
            <strong>Paper mode</strong> — simulated fills only. Use this workspace to tune policy and inspect every decision before going live.
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs sm:text-sm text-amber-100">
            <strong>Live mode</strong> — approved Jupiter swaps can use your connected wallet. Safety checks, slippage limits, and the kill switch remain active.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Metric
            label={microActive ? "Micro equity" : "Equity"}
            value={`$${displayEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            sub={
              microActive
                ? `Target $${MICRO_STRATEGY.targetEquityUsd} · Reserve $${MICRO_STRATEGY.reserveUsd}`
                : pnl === 0
                ? "No PnL"
                : `PnL ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`
            }
            subColor={pnl >= 0 ? "text-emerald-400" : "text-red-400"}
            valueColor="text-brand-400"
          />
          <Metric label="SOL" value={sol !== null ? `${sol.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : "…"} sub={`≈ $${((sol ?? 0) * SOL_PRICE_USD).toFixed(0)}`} />
          <Metric label="USDC" value={usdc ? `$${usdc.uiAmount.toFixed(2)}` : "$0"} valueColor="text-emerald-400" />
          <Metric label="Unrealized" value={`${unrealizedPnl >= 0 ? "+" : ""}$${unrealizedPnl.toFixed(2)}`} valueColor={unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"} />
        </div>

        <div className="mb-6">
          <AuraEnginePanel
            running={aura.running}
            onStart={handleStartS}
            onStop={handleStopS}
            onEmergency={() => {
              aura.emergencyCloseAll();
              log("info", "Kill switch — all positions closed");
            }}
            riskProfile={aura.riskProfile}
            setRiskProfile={aura.setRiskProfile}
            policy={aura.policy}
            setPolicy={aura.setPolicy}
            autoSniper={aura.autoSniper}
            setAutoSniper={aura.setAutoSniper}
            autoReinvest={aura.autoReinvest}
            setAutoReinvest={aura.setAutoReinvest}
            reinvestPct={aura.reinvestPct}
            setReinvestPct={aura.setReinvestPct}
            events={aura.events}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div id="sniper">
              <AutoSniperPanel config={sniper} onChange={updateSniper} onSimulate={simulateSniperTick} />
            </div>
            <div id="copy">
              <AutoCopyPanel
                config={copy}
                onChange={updateCopy}
                onAddWallet={addCopyWallet}
                onRemoveWallet={removeCopyWallet}
                onToggleWallet={toggleCopyWallet}
                onSimulate={simulateCopyTick}
              />
            </div>
            <DcaPanel
              schedules={schedules}
              onAdd={addSchedule}
              onToggle={toggle}
              onRemove={remove}
              onRunPaper={handleDcaRun}
              isPaper={isPaper || microActive}
            />
            <PositionsPanel
              positions={positions}
              closed={closed}
              unrealizedPnl={unrealizedPnl}
              realizedPnl={realizedPnl}
              onClose={(id, reason) => {
                const pos = positions.find((p) => p.id === id);
                closePosition(id, reason);
                if (pos) {
                  let p = (pos.markPriceUsd - pos.entryPriceUsd) * pos.quantity;
                  if (microActive && p < 0) p = Math.max(p, -MICRO_STRATEGY.maxLossPerTradeUsd);
                  if (p >= 0) ledger.recordGain(p, reason);
                  else ledger.recordLoss(Math.abs(p), reason);
                  if (microActive) setMicroEquity((e) => Math.max(MICRO_STRATEGY.reserveUsd, e + p));
                }
              }}
              onSetRisk={setRiskRules}
              onBumpMark={(id, factor) => {
                const pos = positions.find((p) => p.id === id);
                if (pos) updateMark(id, pos.markPriceUsd * factor);
              }}
            />
            <PortfolioEquity ledger={ledger} liveOnChainUsd={liveOnChainUsd} networkLabel={networkLabel} />
            <OpportunityMonitor />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <ExecutorPanel kind={kind} feeSol={feeSol} onKindChange={setKind} onFeeChange={setFeeSol} />
            <StrategyActivity events={strategyEvents} />
            <AuditTrailPanel entries={audit} />
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
              <h3 className="font-semibold mb-3">S strategy limits</h3>
              <div className="space-y-2 text-sm">
                <Row k="Starting capital" v={`$${MICRO_STRATEGY.startingCapitalUsd}`} />
                <Row k="Max per trade" v={`$${MICRO_STRATEGY.maxPerTradeUsd}`} />
                <Row k="Max loss / trade" v={`$${MICRO_STRATEGY.maxLossPerTradeUsd}`} />
                <Row k="Reserve" v={`$${MICRO_STRATEGY.reserveUsd}`} />
                <Row k="Target" v={`$${MICRO_STRATEGY.targetEquityUsd}`} />
                <Row k="TP / SL" v={`${MICRO_STRATEGY.takeProfitPct}% / ${MICRO_STRATEGY.stopLossPct}%`} />
                <Row k="Kill switch" v="ON" />
                <Row k="Paper first" v="Required" />
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function Metric({
  label, value, sub, subColor = "text-zinc-500", valueColor = "",
}: { label: string; value: string; sub?: string; subColor?: string; valueColor?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5">
      <div className="text-xs sm:text-sm text-zinc-400 mb-1">{label}</div>
      <div className={`text-lg sm:text-2xl font-bold ${valueColor}`}>{value}</div>
      {sub && <div className={`text-[10px] sm:text-xs mt-1 ${subColor}`}>{sub}</div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{k}</span>
      <span>{v}</span>
    </div>
  );
}
