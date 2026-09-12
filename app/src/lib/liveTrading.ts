import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { db } from "@/lib/db";
import { tradingAuditEvents, tradingExecutionAttempts } from "@/lib/tradingSchema";
import { getNetwork, getRpcEndpoint, type SolanaNetwork } from "@/lib/rpc";
import { assertSwapSafe, buildJupiterSwapTransaction, getJupiterQuote } from "@/lib/jupiter";

const MAX_TRADE_USD = 5;
const MAX_SLIPPAGE_BPS = 500;
const MAX_PRICE_IMPACT_PCT = 5;
const PROPOSAL_TTL_MS = 45_000;

export function validateWallet(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { new PublicKey(value); return true; } catch { return false; }
}

function validateMint(value: unknown): value is string { return validateWallet(value); }
function proposalHash(value: string) { return createHash("sha256").update(value).digest("hex"); }

async function audit(walletAddress: string, network: SolanaNetwork, eventType: string, message: string, metadata: Record<string, unknown>) {
  await db.insert(tradingAuditEvents).values({ walletAddress, network, eventType, message, metadata });
}

export async function createSwapProposal(input: {
  walletAddress: string; network?: string; inputMint: string; outputMint: string; amountRaw: number; slippageBps: number; idempotencyKey: string;
}) {
  if (!validateWallet(input.walletAddress) || !validateMint(input.inputMint) || !validateMint(input.outputMint)) throw new Error("Invalid Solana address or mint.");
  const network = getNetwork(input.network);
  if (process.env.LIVE_TRADING_KILL_SWITCH === "true") throw new Error("Live trading is paused by the server kill switch.");
  if (input.amountRaw <= 0 || !Number.isSafeInteger(input.amountRaw)) throw new Error("Amount must be a positive integer in base units.");
  if (input.inputMint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" && input.amountRaw > MAX_TRADE_USD * 1_000_000) throw new Error(`Trade exceeds the server cap of $${MAX_TRADE_USD}.`);
  if (!Number.isInteger(input.slippageBps) || input.slippageBps < 1 || input.slippageBps > MAX_SLIPPAGE_BPS) throw new Error(`Slippage must be between 1 and ${MAX_SLIPPAGE_BPS} bps.`);
  if (!/^[a-zA-Z0-9:_-]{12,96}$/.test(input.idempotencyKey)) throw new Error("A valid idempotency key is required.");

  const existing = await db.select().from(tradingExecutionAttempts).where(and(eq(tradingExecutionAttempts.walletAddress, input.walletAddress), eq(tradingExecutionAttempts.network, network), eq(tradingExecutionAttempts.idempotencyKey, input.idempotencyKey))).limit(1);
  if (existing[0]) return existing[0];

  const quote = await getJupiterQuote({ inputMint: input.inputMint, outputMint: input.outputMint, amount: input.amountRaw, slippageBps: input.slippageBps });
  assertSwapSafe(quote, MAX_PRICE_IMPACT_PCT);
  const serializedTransaction = await buildJupiterSwapTransaction({ quoteRaw: quote.raw, userPublicKey: input.walletAddress });
  const hash = proposalHash(serializedTransaction);
  const expiresAt = new Date(Date.now() + PROPOSAL_TTL_MS);
  const inserted = await db.insert(tradingExecutionAttempts).values({ walletAddress: input.walletAddress, network, idempotencyKey: input.idempotencyKey, inputMint: input.inputMint, outputMint: input.outputMint, amountRaw: String(input.amountRaw), status: "proposal", proposalHash: hash, serializedTransaction }).returning();
  await audit(input.walletAddress, network, "proposal_created", "Live swap proposal created", { hash, expiresAt: expiresAt.toISOString(), priceImpactPct: quote.priceImpactPct });
  return { ...inserted[0], quote: { outAmount: quote.outAmount, priceImpactPct: quote.priceImpactPct, routePlan: quote.routePlan }, expiresAt: expiresAt.toISOString() };
}

export async function broadcastSignedSwap(input: { walletAddress: string; network?: string; idempotencyKey: string; signedTransaction: string; proposalHash: string }) {
  if (!validateWallet(input.walletAddress)) throw new Error("Invalid wallet address.");
  const network = getNetwork(input.network);
  const rows = await db.select().from(tradingExecutionAttempts).where(and(eq(tradingExecutionAttempts.walletAddress, input.walletAddress), eq(tradingExecutionAttempts.network, network), eq(tradingExecutionAttempts.idempotencyKey, input.idempotencyKey))).limit(1);
  const attempt = rows[0];
  if (!attempt || attempt.status !== "proposal" || !attempt.serializedTransaction || attempt.proposalHash !== input.proposalHash) throw new Error("Proposal mismatch or already used.");
  if (Date.now() - attempt.createdAt.getTime() > PROPOSAL_TTL_MS) throw new Error("Proposal expired; request a fresh quote.");
  if (process.env.LIVE_TRADING_KILL_SWITCH === "true") throw new Error("Live trading is paused by the server kill switch.");
  if (!/^[A-Za-z0-9+/=]+$/.test(input.signedTransaction)) throw new Error("Invalid signed transaction encoding.");
  const signedBytes = Buffer.from(input.signedTransaction, "base64");
  const tx = VersionedTransaction.deserialize(signedBytes);
  const expected = VersionedTransaction.deserialize(Buffer.from(attempt.serializedTransaction, "base64"));
  if (proposalHash(expected.message.serialize().toString("base64")) !== proposalHash(tx.message.serialize().toString("base64"))) throw new Error("Signed payload does not match proposal.");
  const connection = new Connection(getRpcEndpoint(network), "confirmed");
  const signature = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 2 });
  await db.update(tradingExecutionAttempts).set({ status: "broadcast", signature, updatedAt: new Date() }).where(eq(tradingExecutionAttempts.id, attempt.id));
  await audit(input.walletAddress, network, "broadcast", "Signed swap broadcast", { signature, idempotencyKey: input.idempotencyKey });
  const confirmation = await connection.confirmTransaction(signature, "confirmed");
  const status = confirmation.value.err ? "failed" : "confirmed";
  await db.update(tradingExecutionAttempts).set({ status, error: confirmation.value.err ? JSON.stringify(confirmation.value.err) : null, updatedAt: new Date() }).where(eq(tradingExecutionAttempts.id, attempt.id));
  return { signature, status, network };
}
