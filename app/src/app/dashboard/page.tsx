"use client";

import { useEffect } from "react";
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
import { useSolanaBalances } from "@/hooks/useSolanaBalances";
import { usePortfolioLedger } from "@/hooks/usePortfolioLedger";
import { useAutoStrategies } from "@/hooks/useAutoStrategies";
import { useTradingMode } from "@/hooks/useTradingMode";
import { usePositions } from "@/hooks/usePositions";
import { useDcaSchedules } from "@/hooks/useDcaSchedules";
import { useAuditTrail } from "@/hooks/useAuditTrail";
import {
  getNetwork,
  getNetworkLabel,
  isCustomRpc,
} from "@/lib/rpc";
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

const SOL_PRICE_USD = 180;

export default function DashboardPage() {
  const { connected, publicKey, sendTransaction, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { sol, tokens, loading, error, lastUpdated, refetch } =
    useSolanaBalances();

  const network = getNetwork();
  const networkLabel = getNetworkLabel(network);
  const { mode, setMode, isPaper, isLive } = useTradingMode();
  const { entries: audit, log } = useAuditTrail(mode);

  const usdc = tokens.find((t) => t.symbol === "USDC");
  const liveOnChainUsd =
    sol !== null ? (sol ?? 0) * SOL_PRICE_USD + (usdc?.uiAmount ?? 0) : null;

  const ledger = usePortfolioLedger(liveOnChainUsd, !loading && sol !== null);

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

  const { schedules, addSchedule, toggle, remove, markExecuted } =
    useDcaSchedules();

  // Auto TP/SL evaluation loop
  useEffect(() => {
    const id = setInterval(() => {
      const hits = evaluateRisk();
      hits.forEach((h) => {
        closePosition(h.id, h.reason);
        if (h.pnlUsd >= 0) ledger.recordGain(h.pnlUsd, h.reason);
        else ledger.recordLoss(Math.abs(h.pnlUsd), h.reason);
        log("tp_sl", h.reason, { pnlUsd: h.pnlUsd });
      });
    }, 5000);
    return () => clearInterval(id);
  }, [evaluateRisk, closePosition, ledger, log]);

  useEffect(() => {
    log("mode_change", `Trading mode set to ${mode}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /** Paper or live buy helper with safeguards */
  async function executeBuy(opts: {
    symbol: string;
    mint: string;
    amountUsd: number;
    source: "manual" | "sniper" | "copy" | "dca" | "paper";
  }) {
    if (!publicKey) return;

    const maxSlippageBps = 100; // 1%
    const maxPriceImpactPct = 1.5;

    if (isPaper) {
      // Paper fill
      const entry = SOL_PRICE_USD; // simplified mark
      const qty = opts.amountUsd / entry;
      openPosition({
        symbol: opts.symbol,
        mint: opts.mint,
        entryPriceUsd: entry,
        quantity: qty,
        markPriceUsd: entry,
        stopLossPct: 5,
        takeProfitPct: 15,
        source: "paper",
      });
      log("paper_fill", `Paper buy ${opts.symbol} ~$${opts.amountUsd}`, opts);
      return;
    }

    // Live path: Jupiter quote → guards → build tx → sign → send (with retry)
    try {
      log("swap_quote", `Quoting ${opts.symbol} for ~$${opts.amountUsd}`);

      // Amount in USDC base units (6 decimals) when spending USDC
      const amountRaw = Math.round(opts.amountUsd * 1e6);

      const quote = await withRetry(
        () =>
          getJupiterQuote({
            inputMint: USDC_MINT_MAINNET,
            outputMint: opts.mint === "SOL" ? NATIVE_SOL_MINT : opts.mint,
            amount: amountRaw,
            slippageBps: maxSlippageBps,
          }),
        {
          retries: 2,
          onRetry: (n, err) =>
            log("info", `Quote retry ${n}: ${String(err)}`),
        }
      );

      assertSwapSafe(quote, maxPriceImpactPct);

      const swapTxB64 = await buildJupiterSwapTransaction({
        quoteRaw: quote.raw,
        userPublicKey: publicKey.toBase58(),
      });

      const tx = VersionedTransaction.deserialize(
        Buffer.from(swapTxB64, "base64")
      );

      log("swap_submit", `Submitting swap for ${opts.symbol}`);

      const sig = await withRetry(
        async () => {
          const s = await sendTransaction(tx, connection, {
            maxRetries: 2,
            skipPreflight: false,
          });
          await connection.confirmTransaction(s, "confirmed");
          return s;
        },
        {
          retries: 2,
          onRetry: (n, err) =>
            log("info", `Send retry ${n}: ${String(err)}`),
        }
      );

      openPosition({
        symbol: opts.symbol,
        mint: opts.mint,
        entryPriceUsd: SOL_PRICE_USD,
        quantity: opts.amountUsd / SOL_PRICE_USD,
        markPriceUsd: SOL_PRICE_USD,
        stopLossPct: 5,
        takeProfitPct: 15,
        source: opts.source,
      });

      log("swap_success", `Swap confirmed for ${opts.symbol}`, opts, sig);
    } catch (e) {
      const msg = e instanceof SwapGuardError ? e.message : String(e);
      log("swap_fail", msg, opts);
      if (e instanceof SwapGuardError) {
        log("safety_block", msg);
      }
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
          <h1 className="text-xl sm:text-2xl font-bold text-center">
            Connect your Solana wallet
          </h1>
          <p className="text-zinc-400 text-center max-w-md text-sm sm:text-base">
            Non-custodial · Solana-only · Start in{