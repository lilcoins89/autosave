import { NextRequest, NextResponse } from "next/server";
import { getAgentKitCatalog, runAgentKitAction } from "@/lib/solanaAgentKit";

export const runtime = "nodejs";

function validAddress(value: unknown): value is string {
  return typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const address = body?.address;
  if (!validAddress(address)) {
    return NextResponse.json({ error: "Connect a valid Solana wallet first." }, { status: 400 });
  }

  if (body?.operation === "catalog") {
    return NextResponse.json({ mode: "sign-only", actions: getAgentKitCatalog(address) });
  }

  const action = typeof body?.action === "string" ? body.action : "";
  const input = body?.input && typeof body.input === "object" ? body.input : {};
  if (!action) return NextResponse.json({ error: "An agent action is required." }, { status: 400 });

  try {
    const result = await runAgentKitAction(address, action, input);
    return NextResponse.json({
      mode: "sign-only",
      proposal: {
        action,
        status: "needs-wallet-review",
        wallet: address,
        result,
        message: "Review this proposal in your connected wallet before signing. No transaction was sent.",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Agent action failed." }, { status: 422 });
  }
}
