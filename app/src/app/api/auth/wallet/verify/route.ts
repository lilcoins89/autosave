import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

function decodeBase64(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { address?: string; signature?: string };
  const address = body.address?.trim();
  const signature = body.signature?.trim();
  const nonce = (await cookies()).get("aura_wallet_nonce")?.value;

  if (!address || !signature || !nonce) {
    return NextResponse.json({ error: "Wallet verification expired. Please retry." }, { status: 400 });
  }

  try {
    const publicKey = new PublicKey(address);
    const message = `AURA wallet login\n\nSign this one-time message to enter your paper trading desk.\nNonce: ${nonce}`;
    const valid = nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      decodeBase64(signature),
      publicKey.toBytes(),
    );

    if (!valid) return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });

    const response = NextResponse.json({ authenticated: true, address: publicKey.toBase58() });
    response.cookies.set("aura_wallet_session", publicKey.toBase58(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    response.cookies.delete("aura_wallet_nonce");
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid wallet address or signature." }, { status: 400 });
  }
}
