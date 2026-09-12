import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST() {
  const nonce = randomBytes(24).toString("hex");
  const response = NextResponse.json({ nonce });
  response.cookies.set("aura_wallet_nonce", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 300,
    path: "/",
  });
  return response;
}
