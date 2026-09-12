import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { SolanaAgentKit, type BaseWallet } from "solana-agent-kit";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import MiscPlugin from "@solana-agent-kit/plugin-misc";

const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

function createReviewWallet(address: string): BaseWallet {
  const publicKey = new PublicKey(address);
  const requiresWalletReview = async () => {
    throw new Error("Wallet signing is intentionally deferred to the connected wallet adapter.");
  };

  return {
    publicKey,
    signTransaction: requiresWalletReview,
    signAllTransactions: async () => {
      throw new Error("Wallet signing is intentionally deferred to the connected wallet adapter.");
    },
    sendTransaction: async () => {
      throw new Error("Sending is disabled until the user reviews and signs in the wallet.");
    },
    signMessage: requiresWalletReview,
    signAndSendTransaction: async () => {
      throw new Error("Sending is disabled until the user reviews and signs in the wallet.");
    },
  } as unknown as BaseWallet;
}

export function createSolanaAgent(address: string) {
  return new SolanaAgentKit(createReviewWallet(address), rpcUrl, {
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    signOnly: true,
  }).use(TokenPlugin).use(MiscPlugin);
}

export function getAgentKitCatalog(address: string) {
  const agent = createSolanaAgent(address);
  return agent.actions.map((action) => ({
    name: action.name,
    description: action.description,
    similes: action.similes.slice(0, 4),
  }));
}

export async function runAgentKitAction(address: string, actionName: string, input: Record<string, unknown>) {
  const agent = createSolanaAgent(address);
  const action = agent.actions.find((candidate) => candidate.name === actionName);
  if (!action) throw new Error("This agent action is not allowlisted.");
  return action.handler(agent, input);
}

export { Transaction, VersionedTransaction };
