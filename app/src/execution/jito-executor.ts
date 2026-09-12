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
 * Jito bundle executor (from warp-id/solana-trading-bot).
 * Sends tip tx + main tx as a bundle to multiple Jito block engines.
 */
export class JitoTransactionExecutor implements TransactionExecutor {
  readonly kind = "jito" as const;

  private readonly tipAccounts = [
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  ];

  private readonly endpoints = [
    "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
    "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles",
    "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
    "https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles",
    "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
  ];

  constructor(
    private readonly connection: Connection,
    private readonly feeSol: number = 0.001
  ) {}

  private randomTipAccount(): PublicKey {
    const k =
      this.tipAccounts[Math.floor(Math.random() * this.tipAccounts.length)];
    return new PublicKey(k);
  }

  async executeAndConfirm(
    transaction: VersionedTransaction,
    latestBlockhash: BlockhashWithExpiryBlockHeight,
    sign: SignFn
  ): Promise<ExecuteResult> {
    try {
      const feeLamports = Math.max(
        100_000,
        Math.round(this.feeSol * LAMPORTS_PER_SOL)
      );

      const payerKey =
        transaction.message.staticAccountKeys[0] ??
        transaction.message.getAccountKeys().get(0);

      if (!payerKey) {
        return {
          confirmed: false,
          error: "Cannot determine payer",
          executor: this.kind,
        };
      }

      const tipMessage = new TransactionMessage({
        payerKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [
          SystemProgram.transfer({
            fromPubkey: payerKey,
            toPubkey: this.randomTipAccount(),
            lamports: feeLamports,
          }),
        ],
      }).compileToV0Message();

      let tipTx = new VersionedTransaction(tipMessage);
      tipTx = await sign(tipTx);

      let mainTx = transaction;
      if (!mainTx.signatures.some((s) => s.some((b) => b !== 0))) {
        mainTx = await sign(mainTx);
      }

      const tipSig = bs58.encode(tipTx.signatures[0]);
      const serialized = [
        bs58.encode(tipTx.serialize()),
        bs58.encode(mainTx.serialize()),
      ];

      const requests = this.endpoints.map((url) =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "sendBundle",
            params: [serialized],
          }),
        }).then(async (r) => {
          if (!r.ok) throw new Error(`Jito ${r.status}`);
          return r.json();
        })
      );

      const results = await Promise.allSettled(requests);
      const ok = results.some((r) => r.status === "fulfilled");

      if (!ok) {
        return {
          confirmed: false,
          error: "All Jito endpoints failed",
          executor: this.kind,
        };
      }

      const confirmation = await this.connection.confirmTransaction(
        {
          signature: tipSig,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        this.connection.commitment
      );

      return {
        confirmed: !confirmation.value.err,
        signature: tipSig,
        error: confirmation.value.err
          ? JSON.stringify(confirmation.value.err)
          : undefined,
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
