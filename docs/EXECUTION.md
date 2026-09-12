# Execution Architecture (Warp-inspired)

AutoSave uses a **pluggable transaction executor** layer adapted from
[warp-id/solana-trading-bot](https://github.com/warp-id/solana-trading-bot).

## Design goals

- Non-custodial: signing always happens in the user's wallet
- Pluggable: swap executors without changing swap / strategy code
- Production paths for congested Solana: **Warp** and **Jito**

## Executors

| Kind | Class | Behavior |
|------|--------|----------|
| `default` | `DefaultTransactionExecutor` | `sendRawTransaction` + `confirmTransaction` via RPC |
| `warp` | `WarpTransactionExecutor` | Sign fee tx + main tx locally → POST serialized txs to `https://tx.warp.id/transaction/execute` |
| `jito` | `JitoTransactionExecutor` | Tip tx + main tx as bundle to Jito block engines |

## Interface

```ts
interface TransactionExecutor {
  kind: "default" | "warp" | "jito";
  executeAndConfirm(
    transaction: VersionedTransaction,
    latestBlockhash: BlockhashWithExpiryBlockHeight,
    sign: SignFn
  ): Promise<ExecuteResult>;
}
```

`SignFn` is provided by `@solana/wallet-adapter` (`signTransaction`) — never a raw secret key in the browser.

## Warp security model (upstream)

From Warp docs:

- Payload does **not** include the wallet private key
- Fee transaction is signed on the client
- Hosted service forwards to third-party providers
- Transactions / keys are not stored by Warp

## Factory

```ts
import { createTransactionExecutor } from "@/execution";

const executor = createTransactionExecutor({
  connection,
  kind: "warp", // or "jito" | "default"
  feeSol: 0.001,
});
```

Or via hook:

```ts
const { kind, setKind, feeSol, setFeeSol, execute } = useExecutor();
const result = await execute(versionedSwapTx);
```

## UI

Dashboard **Execution engine** panel lets users pick Default / Warp / Jito and set tip fee. Preference is stored in `localStorage`.

## Files

```
app/src/execution/
  types.ts
  default-executor.ts
  warp-executor.ts
  jito-executor.ts
  index.ts
app/src/hooks/useExecutor.ts
app/src/components/ExecutorPanel.tsx
```

## Attribution

Architecture and Warp/Jito patterns inspired by
[warp-id/solana-trading-bot](https://github.com/warp-id/solana-trading-bot) (MS-PL).
Adapted for AutoSave's non-custodial Next.js client.
