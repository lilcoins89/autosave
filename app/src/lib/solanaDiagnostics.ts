import { Connection, PublicKey } from "@solana/web3.js";

export type SolanaHealth = {
  ok: boolean;
  network: string;
  slot?: number;
  balanceSol?: number;
  latencyMs?: number;
  error?: string;
};

export async function checkSolanaHealth(
  endpoint: string,
  address?: string,
): Promise<SolanaHealth> {
  const startedAt = Date.now();
  const connection = new Connection(endpoint, "confirmed");

  try {
    const slot = await connection.getSlot("confirmed");
    const balanceLamports = address
      ? await connection.getBalance(new PublicKey(address), "confirmed")
      : undefined;

    return {
      ok: true,
      network: endpoint.includes("devnet") ? "devnet" : endpoint.includes("testnet") ? "testnet" : "mainnet-beta",
      slot,
      balanceSol: balanceLamports === undefined ? undefined : balanceLamports / 1_000_000_000,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      network: endpoint.includes("devnet") ? "devnet" : endpoint.includes("testnet") ? "testnet" : "mainnet-beta",
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Solana RPC health check failed",
    };
  }
}

export function explorerUrl(signature: string, cluster: string): string {
  const suffix = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${suffix}`;
}
