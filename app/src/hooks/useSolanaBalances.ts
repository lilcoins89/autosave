"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

// Common mainnet mints
export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);
export const USDT_MINT = new PublicKey(
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
);

export interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number; // human readable
  decimals: number;
  uiAmount: number;
}

export interface WalletBalances {
  sol: number | null;
  tokens: TokenBalance[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

const KNOWN_MINTS: Record<string, { symbol: string; decimals: number }> = {
  [USDC_MINT.toBase58()]: { symbol: "USDC", decimals: 6 },
  [USDT_MINT.toBase58()]: { symbol: "USDT", decimals: 6 },
};

export function useSolanaBalances(): WalletBalances {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [sol, setSol] = useState<number | null>(null);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setSol(null);
      setTokens([]);
      setError(null);
      setLastUpdated(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // SOL balance
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setSol(lamports / LAMPORTS_PER_SOL);

      // Token accounts (parsed)
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") },
        "confirmed"
      );

      const parsed: TokenBalance[] = tokenAccounts.value
        .map((ta) => {
          const info = ta.account.data.parsed?.info;
          if (!info) return null;

          const mint: string = info.mint;
          const tokenAmount = info.tokenAmount;
          const uiAmount = Number(tokenAmount?.uiAmount ?? 0);
          const decimals = Number(tokenAmount?.decimals ?? 0);

          // Skip zero balances
          if (uiAmount <= 0) return null;

          const known = KNOWN_MINTS[mint];
          return {
            mint,
            symbol: known?.symbol ?? mint.slice(0, 4) + "…",
            amount: Number(tokenAmount?.amount ?? 0),
            decimals,
            uiAmount,
          } as TokenBalance;
        })
        .filter(Boolean) as TokenBalance[];

      // Sort: known stables first, then by amount
      parsed.sort((a, b) => {
        const aKnown = KNOWN_MINTS[a.mint] ? 1 : 0;
        const bKnown = KNOWN_MINTS[b.mint] ? 1 : 0;
        if (aKnown !== bKnown) return bKnown - aKnown;
        return b.uiAmount - a.uiAmount;
      });

      setTokens(parsed);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch balances", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchBalances();

    // Light polling while connected
    if (!publicKey) return;
    const id = setInterval(fetchBalances, 30_000);
    return () => clearInterval(id);
  }, [fetchBalances, publicKey]);

  return {
    sol,
    tokens,
    loading,
    error,
    lastUpdated,
    refetch: fetchBalances,
  };
}
