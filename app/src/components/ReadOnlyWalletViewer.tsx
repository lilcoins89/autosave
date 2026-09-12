"use client";

import { FormEvent, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { TRADING_WALLET_ADDRESS, SOLANAPYD_MINT } from "@/lib/tradingConfig";

type Token = { mint?: string; symbol?: string; amount?: number; decimals?: number; uiAmount?: number };
type Transaction = { signature?: string; type?: string; description?: string; timestamp?: number };
type HeliusData = { balances?: { nativeBalance?: number; tokens?: Token[]; tradingToken?: Token | null }; transactions?: Transaction[]; error?: string };

function shorten(value: string, size = 6) {
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}

export function ReadOnlyWalletViewer({ compact = false }: { compact?: boolean }) {
  const [address, setAddress] = useState(TRADING_WALLET_ADDRESS);
  const [data, setData] = useState<HeliusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = address.trim();
    try {
      new PublicKey(value);
    } catch {
      setError("Enter a valid Solana public address.");
      setData(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/helius?address=${encodeURIComponent(value)}`);
      const next = (await response.json()) as HeliusData;
      if (!response.ok) throw new Error(next.error ?? "Unable to load wallet data.");
      setData(next);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : "Unable to load wallet data.");
    } finally {
      setLoading(false);
    }
  }

  const nativeSol = ((data?.balances?.nativeBalance ?? 0) / 1_000_000_000).toFixed(4);
  const tokens = data?.balances?.tokens ?? [];
  const transactions = data?.transactions ?? [];
  const tradingToken = data?.balances?.tradingToken ?? tokens.find((token) => token.mint === SOLANAPYD_MINT) ?? null;

  return (
    <section className={`rounded-2xl border border-[#1b3b2c] bg-[#0d1c16] p-4 ${compact ? "" : "sm:p-5"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00E676]">Read-only intelligence</p>
          <h2 className="mt-1 text-lg font-semibold text-[#e8fff3]">Inspect any Solana wallet</h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-[#8ba99a]">Paste a public address to view Helius-powered balances, tokens, and recent activity. No private keys are requested or stored.</p>
        </div>
        <span className="rounded-full border border-[#9945FF]/30 bg-[#9945FF]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#c7a7ff]">Helius</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="readonly-wallet-address">Public Solana address</label>
        <input id="readonly-wallet-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Paste a public wallet address" className="min-w-0 flex-1 rounded-xl border border-[#24523b] bg-[#07100D] px-3 py-2.5 text-sm text-[#e8fff3] outline-none placeholder:text-[#557466] focus:border-[#00E676]" autoComplete="off" spellCheck={false} />
        <button type="submit" disabled={loading || !address.trim()} className="rounded-xl bg-[#00E676] px-4 py-2.5 text-sm font-bold text-[#07100D] transition hover:bg-[#42f89a] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Loading…" : "Inspect wallet"}</button>
      </form>

      {error && <p className="mt-3 text-xs text-rose-300" role="alert">{error}</p>}

      {data && !error && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div className="rounded-xl border border-[#24523b] bg-[#07100D] p-3">
            <p className="text-[10px] uppercase tracking-wider text-[#8ba99a]">Address</p>
            <p className="mt-1 break-all font-mono text-xs text-[#e8fff3]">{shorten(address, 8)}</p>
            <p className="mt-4 text-[10px] uppercase tracking-wider text-[#8ba99a]">Native balance</p>
            <p className="mt-1 text-2xl font-semibold text-[#00E676]">{nativeSol} SOL</p>
            <p className="mt-4 text-[10px] uppercase tracking-wider text-[#8ba99a]">Trading balance</p>
            <p className="mt-1 text-xl font-semibold text-[#9945FF]">{tradingToken ? Number(tradingToken.uiAmount ?? 0).toLocaleString() : "0"} PYD</p>
            <p className="mt-1 text-xs text-[#8ba99a]">{tokens.length} token accounts · {transactions.length} recent transactions</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#24523b] bg-[#07100D] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#8ba99a]">Token holdings</p>
              <div className="mt-2 flex max-h-40 flex-col gap-2 overflow-auto">
                {tokens.length ? tokens.slice(0, 12).map((token, index) => <div key={`${token.mint ?? "token"}-${index}`} className="flex items-center justify-between gap-2 text-xs"><span className="truncate text-[#e8fff3]">{token.symbol ?? shorten(token.mint ?? "Unknown", 4)}</span><span className="font-mono text-[#00E676]">{Number(token.uiAmount ?? 0).toLocaleString()}</span></div>) : <span className="text-xs text-[#8ba99a]">No token holdings returned.</span>}
              </div>
            </div>
            <div className="rounded-xl border border-[#24523b] bg-[#07100D] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#8ba99a]">Recent activity</p>
              <div className="mt-2 flex max-h-40 flex-col gap-2 overflow-auto">
                {transactions.length ? transactions.map((transaction, index) => <div key={`${transaction.signature ?? "tx"}-${index}`} className="border-b border-[#183326] pb-2 text-xs last:border-0"><p className="truncate text-[#e8fff3]">{transaction.description ?? transaction.type ?? "Solana transaction"}</p><p className="mt-1 font-mono text-[#9945FF]">{shorten(transaction.signature ?? "unknown", 5)}</p></div>) : <span className="text-xs text-[#8ba99a]">No recent activity returned.</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
