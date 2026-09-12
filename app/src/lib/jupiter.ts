/**
 * Jupiter swap helpers (Solana-only).
 * Quote + swap transaction building with slippage / price-impact guards.
 */

const JUPITER_QUOTE = "https://quote-api.jup.ag/v6/quote";
const JUPITER_SWAP = "https://quote-api.jup.ag/v6/swap";

export interface JupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number; // raw integer amount (lamports / token base units)
  slippageBps: number;
}

export interface JupiterQuoteResult {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  routePlan: unknown[];
  raw: unknown;
}

export class SwapGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SwapGuardError";
  }
}

/** Fetch a Jupiter quote */
export async function getJupiterQuote(
  params: JupiterQuoteParams
): Promise<JupiterQuoteResult> {
  const url = new URL(JUPITER_QUOTE);
  url.searchParams.set("inputMint", params.inputMint);
  url.searchParams.set("outputMint", params.outputMint);
  url.searchParams.set("amount", String(params.amount));
  url.searchParams.set("slippageBps", String(params.slippageBps));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter quote failed: ${res.status} ${text}`);
  }
  const data = await res.json();

  const priceImpactPct = Number(data.priceImpactPct ?? 0);

  return {
    inputMint: data.inputMint,
    outputMint: data.outputMint,
    inAmount: data.inAmount,
    outAmount: data.outAmount,
    priceImpactPct,
    routePlan: data.routePlan ?? [],
    raw: data,
  };
}

/** Enforce slippage already requested; block high price impact */
export function assertSwapSafe(
  quote: JupiterQuoteResult,
  maxPriceImpactPct: number
): void {
  if (quote.priceImpactPct > maxPriceImpactPct) {
    throw new SwapGuardError(
      `Price impact ${quote.priceImpactPct.toFixed(2)}% exceeds max ${maxPriceImpactPct}%`
    );
  }
  if (!quote.outAmount || Number(quote.outAmount) <= 0) {
    throw new SwapGuardError("Invalid output amount from route");
  }
}

/** Build unsigned swap transaction (base64) for the user to sign */
export async function buildJupiterSwapTransaction(opts: {
  quoteRaw: unknown;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
}): Promise<string> {
  const res = await fetch(JUPITER_SWAP, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: opts.quoteRaw,
      userPublicKey: opts.userPublicKey,
      wrapAndUnwrapSol: opts.wrapAndUnwrapSol ?? true,
      dynamicComputeUnitLimit: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter swap build failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (!data.swapTransaction) {
    throw new Error("No swapTransaction returned by Jupiter");
  }
  return data.swapTransaction as string;
}

export const NATIVE_SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
