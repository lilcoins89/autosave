import { NextRequest, NextResponse } from "next/server";
import { PublicKey, Connection } from "@solana/web3.js";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { walletObservations } from "@/lib/db-schema";
import { getNetwork, getRpcEndpoint } from "@/lib/rpc";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim();
  if (!address) return jsonError("Wallet address is required.", 400);
  try {
    new PublicKey(address);
  } catch {
    return jsonError("Wallet address is invalid.", 400);
  }

  try {
    const network = getNetwork();
    const heliusKey = process.env.HELIUS_API_KEY;
    const endpoint = process.env.NEXT_PUBLIC_RPC_URL?.trim()
      || (heliusKey && network !== "testnet" ? `https://${network === "devnet" ? "devnet" : "mainnet"}.helius-rpc.com/?api-key=${heliusKey}` : getRpcEndpoint());
    const connection = new Connection(endpoint, "confirmed");
    const owner = new PublicKey(address);
    const [balance, tokenAccounts, signatures] = await Promise.all([
      connection.getBalance(owner, "confirmed"),
      connection.getParsedTokenAccountsByOwner(owner, { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }, "confirmed"),
      connection.getSignaturesForAddress(owner, { limit: 8 }, "confirmed"),
    ]);

    const tokens = tokenAccounts.value.map(({ pubkey, account }) => {
      const info = account.data.parsed.info;
      return {
        mint: info.mint as string,
        amount: Number(info.tokenAmount.amount),
        decimals: Number(info.tokenAmount.decimals),
        uiAmount: Number(info.tokenAmount.uiAmount ?? 0),
        symbol: info.mint as string,
        account: pubkey.toBase58(),
      };
    }).filter((token) => token.amount > 0);

    const transactions = signatures.map((signature) => ({
      signature: signature.signature,
      type: signature.err ? "failed" : "confirmed",
      description: signature.err ? "Transaction failed" : "Confirmed transaction",
      timestamp: signature.blockTime ?? undefined,
    }));

    await db.insert(walletObservations).values({
      address,
      balanceLamports: balance,
      tokenCount: tokens.length,
      transactionCount: transactions.length,
      observedAt: new Date(),
    }).onConflictDoUpdate({
      target: walletObservations.address,
      set: {
        balanceLamports: balance,
        tokenCount: tokens.length,
        transactionCount: transactions.length,
        observedAt: new Date(),
      },
    });

    const observation = await db.select().from(walletObservations).where(eq(walletObservations.address, address)).limit(1);
    return NextResponse.json({
      balances: { nativeBalance: balance, tokens },
      transactions,
      observation: observation[0] ?? null,
      provider: "helius-rpc",
    }, { headers: { "Cache-Control": "private, max-age=15" } });
  } catch {
    return jsonError("Wallet data is unavailable right now.", 502);
  }
}
