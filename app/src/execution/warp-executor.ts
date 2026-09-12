import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  ExecuteResult,
  SignFn,
  TransactionExecutor,
} from "./types";

/**
 * Warp hosted executor (from warp-id/solana-trading-bot).
 *
 * Flow:
 * 1. User signs a small fee transfer to WARP fee wallet (locally)
 * 2. User signs the main swap/tx (locally)
 * 3. Both serialized txs (no private keys) are POSTed to https://tx.warp.id/transaction/execute
 * 4. Warp routes via third-party providers for better landing rates
 *
 * Private keys never leave the wallet.
 */
export class WarpTransactionExecutor implements TransactionExecutor {
  readonly kind = "warp" as const;

  private readonly warpFeeWallet = new PublicKey(
    "WARPzUMPnycu9eeCZ95rcAUxorqpBqHndfV3ZP5FSyS"
  );

  constructor(
    private readonly connection: Connection,
    /** Fee in SOL paid to Warp (min ~0.0001, recommended >= 0.001) */
    private readonly feeSol: number = 0.001
  ) {}

  async executeAndConfirm(
    transaction: VersionedTransaction,
    latestBlockhash: BlockhashWithExpiryBlockHeight,
    sign: SignFn
  ): Promise<ExecuteResult> {
    try {
      const feeLamports = Math.max(
        100_000, // 0.0001 SOL floor
        Math.round(this.feeSol * LAMPORTS_PER_SOL)
      );

      // Recover payer from the transaction message
      const payerKey =
        transaction.message.staticAccountKeys[0] ??
        transaction.message.getAccountKeys().get(0);

      if (!payerKey) {
        return {
          confirmed: false,
          error: "Cannot determine payer from transaction",
          executor: this.kind,
        };
      }

      const feeMessage = new TransactionMessage({
        payerKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [
          SystemProgram.transfer({
            fromPubkey: payerKey,
            toPubkey: this.warpFeeWallet,
            lamports: feeLamports,
          }),
        ],
      }).compileToV0Message();

      let feeTx = new VersionedTransaction(feeMessage);
      feeTx = await sign(feeTx);

      // Main tx must already be signed by caller, or we sign here
      let mainTx = transaction;
      if (!mainTx.signatures.some((s) => s.some((b) => b !== 0))) {
        mainTx = await sign(mainTx);
      }

      const body = {
        transactions: [
          bs58.encode(feeTx.serialize()),
          bs58.encode(mainTx.serialize()),
        ],
        latestBlockhash,
      };

      const res = await fetch("https://tx.warp.id/transaction/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          confirmed: false,
          error: `Warp HTTP ${res.status}: ${text}`,
          executor: this.kind,
        };
      }

      const data = (await res.json()) as {
        confirmed: boolean;
        signature?: string;
        error?: string;
      };

      return {
        confirmed: Boolean(data.confirmed),
        signature: data.signature,
        error: data.error,
        executor: this.kind,
      };
    } catch (e) {
      return {
        confirmed: false,
        error: e instanceof Error ? e.message : String(e),
        executor: this.kind,
      };
    }
  }
}
