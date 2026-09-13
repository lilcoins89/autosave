import { NextRequest, NextResponse } from "next/server";
import { createSwapProposal } from "@/lib/liveTrading";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  try {
    const proposal = await createSwapProposal({
      walletAddress: body?.walletAddress,
      network: body?.network,
      inputMint: body?.inputMint,
      outputMint: body?.outputMint,
      amountRaw: Number(body?.amountRaw),
      slippageBps: Number(body?.slippageBps),
      idempotencyKey: body?.idempotencyKey,
    });
    return NextResponse.json({ proposal });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create proposal." }, { status: 422 });
  }
}
