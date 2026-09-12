import { NextRequest, NextResponse } from "next/server";
import { broadcastSignedSwap } from "@/lib/liveTrading";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  try {
    const result = await broadcastSignedSwap({
      walletAddress: body?.walletAddress,
      network: body?.network,
      idempotencyKey: body?.idempotencyKey,
      signedTransaction: body?.signedTransaction,
      proposalHash: body?.proposalHash,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to broadcast signed transaction." }, { status: 422 });
  }
}
