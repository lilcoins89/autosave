/**
 * Warp-inspired pluggable transaction execution architecture.
 * Adapted from https://github.com/warp-id/solana-trading-bot for
 * non-custodial browser wallets (no private keys leave the client).
 */

import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  VersionedTransaction,
} from "@solana/web3.js";

export type ExecutorKind = "default" | "warp" | "jito";

export interface ExecuteResult {
  confirmed: boolean;
  signature?: string;
  error?: string;
  executor: ExecutorKind;
}

/**
 * Signer abstraction so executors work with wallet-adapter
 * (signTransaction) instead of raw Keypairs.
 */
export type SignFn = (
  tx: VersionedTransaction
) => Promise<VersionedTransaction>;

export type SendRawFn = (
  raw: Uint8Array
) => Promise<string>;

export interface TransactionExecutor {
  readonly kind: ExecutorKind;
  executeAndConfirm(
    transaction: VersionedTransaction,
    latestBlockhash: BlockhashWithExpiryBlockHeight,
    sign: SignFn
  ): Promise<ExecuteResult>;
}

export interface ExecutorContext {
  connection: Connection;
  /** Priority / tip fee in SOL (e.g. 0.001) for warp & jito */
  feeSol?: number;
}
