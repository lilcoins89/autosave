import { clusterApiUrl, Cluster } from "@solana/web3.js";

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";

const VALID_NETWORKS: SolanaNetwork[] = ["mainnet-beta", "devnet", "testnet"];

/**
 * Active network.
 * Priority:
 * 1. NEXT_PUBLIC_SOLANA_NETWORK env
 * 2. Default = mainnet-beta
 */
export function getNetwork(): SolanaNetwork {
  const raw = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta")
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
export function getRpcEndpoint(): string {
  const custom = process.env.NEXT_PUBLIC_RPC_URL?.trim();
  if (custom) return custom;

  return clusterApiUrl(getNetwork() as Cluster);
}

export function isCustomRpc(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RPC_URL?.trim());
}

export function getNetworkLabel(network?: SolanaNetwork): string {
  const n = network ?? getNetwork();
  switch (n) {
    case "mainnet-beta":
      return "Mainnet";
    case "devnet":
      return "Devnet";
    case "testnet":
      return "Testnet";
    default:
      return n;
  }
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
