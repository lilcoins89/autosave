import { NextResponse } from "next/server";
import { checkSolanaHealth } from "@/lib/solanaDiagnostics";
import { getRpcEndpoint, getNetwork } from "@/lib/rpc";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address") ?? undefined;
  const health = await checkSolanaHealth(getRpcEndpoint(), address);

  return NextResponse.json({ ...health, configuredNetwork: getNetwork() }, { status: health.ok ? 200 : 503 });
}
