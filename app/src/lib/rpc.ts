import { clusterApiUrl } from "@solana/web3.js";

/**
 * Returns the RPC endpoint to use.
 * Priority:
 * 1. NEXT_PUBLIC_RPC_URL (recommended: Helius)
 * 2. Public mainnet-beta cluster URL (rate-limited, not for production)
 */
export function getRpcEndpoint(): string {
  const custom = process.env.NEXT_PUBLIC_RPC_URL;
  if (custom && custom.trim().length > 0) {
    return custom.trim();
  }
  // Fallback — fine for local demo, not for production traffic
  return clusterApiUrl("mainnet-beta");
}

export function isCustomRpc(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RPC_URL?.trim());
}
