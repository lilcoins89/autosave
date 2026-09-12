import { NextRequest, NextResponse } from "next/server";

const HELIUS_BASE = "https://api.helius.xyz";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  const apiKey = process.env.HELIUS_API_KEY;

  if (!address) return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "Helius is not configured." }, { status: 503 });

  try {
    const [balancesResponse, transactionsResponse] = await Promise.all([
      fetch(`${HELIUS_BASE}/v0/addresses/${address}/balances?api-key=${apiKey}`, { next: { revalidate: 15 } }),
      fetch(`${HELIUS_BASE}/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=8`, { next: { revalidate: 15 } }),
    ]);

    if (!balancesResponse.ok || !transactionsResponse.ok) {
      return NextResponse.json({ error: "Helius could not load wallet intelligence." }, { status: 502 });
    }

    const balances = await balancesResponse.json();
    const transactions = await transactionsResponse.json();
    return NextResponse.json({ balances, transactions, provider: "helius" });
  } catch {
    return NextResponse.json({ error: "Helius request failed." }, { status: 502 });
  }
}
