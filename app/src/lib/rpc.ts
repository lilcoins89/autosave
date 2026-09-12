import { clusterApiUrl, Cluster } from "@solana/web3.js";

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";

const VALID_NETWORKS: SolanaNetwork[] = ["mainnet-beta", "devnet", "testnet"];

/**
 * Active network.
 * Priority:
 * 1. NEXT_PUBLIC_SOLANA_NETWORK env
 * 2. Default = mainnet-beta
 */
export function getNetwork(input?: string): SolanaNetwork {
  const raw = (input || process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet")
    .trim()
    .toLowerCase();

  if (VALID_NETWORKS.includes(raw as SolanaNetwork)) {
    return raw as SolanaNetwork;
  }
  return "mainnet-beta";
}

/**
 * RPC endpoint resolution.
 * Priority:
 * 1. NEXT_PUBLIC_RPC_URL (works for any network — put your Helius mainnet/devnet URL here)
 * 2. Public cluster URL for the selected network
 */
export function getRpcEndpoint(network?: SolanaNetwork): string {
  const custom = network === getNetwork() ? process.env.NEXT_PUBLIC_RPC_URL : undefined;
  if (custom) return custom;

  return clusterApiUrl((network ?? getNetwork()) as Cluster);
}

export function isCustomRpc(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RPC_URL?.trim());
}

export function getNetworkLabel(_network?: SolanaNetwork): string {
  return "Connected";
}

export function getNetworkColor(network?: SolanaNetwork): string {
  const n = network ?? getNetwork();
  switch (n) {
    case "mainnet-beta":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "devnet":
      return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
    case "testnet":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    default:
      return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  }
}
