import { NextResponse } from "next/server";

import { MICRO_STRATEGY } from "@/lib/microStrategy";

const sessions = new Map<string, { startedAt: string; status: "running" | "stopped" | "killed" }>();

function policyMatches(input: unknown) {
  if (!input || typeof input !== "object") return false;
  const policy = input as Record<string, unknown>;
  return (
    policy.paperMode === true &&
    policy.startingCapitalUsd === MICRO_STRATEGY.startingCapitalUsd &&
    policy.maxPerTradeUsd === MICRO_STRATEGY.maxPerTradeUsd &&
    policy.maxLossPerTradeUsd === MICRO_STRATEGY.maxLossPerTradeUsd &&
    policy.reserveUsd === MICRO_STRATEGY.reserveUsd &&
    policy.targetEquityUsd === MICRO_STRATEGY.targetEquityUsd &&
    policy.automaticTpSl === true &&
    policy.killSwitchEnabled === true
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === "start") {
    if (!policyMatches(body?.policy)) {
      return NextResponse.json(
        { ok: false, error: "Trading policy rejected. Paper mode and all safety limits are required." },
        { status: 400 },
      );
    }

    const sessionId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    sessions.set(sessionId, { startedAt, status: "running" });

    return NextResponse.json({
      ok: true,
      sessionId,
      startedAt,
      mode: "paper",
      message: "Backend connected. AURA paper session armed with safety gates enabled.",
    });
  }

  if ((action === "stop" || action === "kill") && typeof body?.sessionId === "string") {
    const session = sessions.get(body.sessionId);
    if (!session) return NextResponse.json({ ok: false, error: "Trading session not found." }, { status: 404 });
    session.status = action === "kill" ? "killed" : "stopped";
    return NextResponse.json({ ok: true, sessionId: body.sessionId, status: session.status });
  }

  return NextResponse.json({ ok: false, error: "Unsupported trading session action." }, { status: 400 });
}
