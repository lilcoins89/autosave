import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  ExecuteResult,
  SignFn,
  TransactionExecutor,
} from "./types";

/**
 * Standard RPC executor (Warp bot: DefaultTransactionExecutor).
 * Sign locally → sendRawTransaction → confirmTransaction.
 */
export class DefaultTransactionExecutor implements TransactionExecutor {
  readonly kind = "default" as const;

  constructor(private readonly connection: Connection) {}

  async executeAndConfirm(
    transaction: VersionedTransaction,
    latestBlockhash: BlockhashWithExpiryBlockHeight,
    sign: SignFn
  ): Promise<ExecuteResult> {
    try {
      const signed = await sign(transaction);
      const signature = await this.connection.sendRawTransaction(
        signed.serialize(),
        {
          skipPreflight: false,
          maxRetries: 3,
          preflightCommitment: this.connection.commitment,
        }
      );

      const confirmation = await this.connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        this.connection.commitment
      );

      if (confirmation.value.err) {
        return {
          confirmed: false,
          signature,
          error: JSON.stringify(confirmation.value.err),
          executor: this.kind,
        };
      }

      return { confirmed: true, signature, executor: this.kind };
    } catch (e) {
      return {
        confirmed: false,
        error: e instanceof Error ? e.message : String(e),
        executor: this.kind,
      };
    }
  }
}
