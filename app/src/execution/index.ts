import { Connection } from "@solana/web3.js";
import { DefaultTransactionExecutor } from "./default-executor";
import { WarpTransactionExecutor } from "./warp-executor";
import { JitoTransactionExecutor } from "./jito-executor";
import { ExecutorKind, TransactionExecutor } from "./types";

export * from "./types";
export { DefaultTransactionExecutor } from "./default-executor";
export { WarpTransactionExecutor } from "./warp-executor";
export { JitoTransactionExecutor } from "./jito-executor";

export interface CreateExecutorOptions {
  connection: Connection;
  kind?: ExecutorKind;
  /** Tip / Warp fee in SOL (default 0.001) */
  feeSol?: number;
}

/**
 * Factory matching Warp bot's TRANSACTION_EXECUTOR switch:
 * default | warp | jito
 */
export function createTransactionExecutor(
  opts: CreateExecutorOptions
): TransactionExecutor {
  const kind = opts.kind ?? "default";
  const fee = opts.feeSol ?? 0.001;

  switch (kind) {
    case "warp":
      return new WarpTransactionExecutor(opts.connection, fee);
    case "jito":
      return new JitoTransactionExecutor(opts.connection, fee);
    case "default":
    default:
      return new DefaultTransactionExecutor(opts.connection);
  }
}
