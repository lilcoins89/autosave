import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

export async function GET() {
  const value = (await cookies()).get("aura_wallet_session")?.value;
  if (!value) return NextResponse.json({ authenticated: false }, { status: 401 });
  try {
    return NextResponse.json({ authenticated: true, address: new PublicKey(value).toBase58() });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
