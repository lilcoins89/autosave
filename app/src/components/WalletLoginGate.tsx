"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";

function toBase64(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

export function WalletLoginGate({ children }: { children: React.ReactNode }) {
  const { connected, publicKey, signMessage } = useWallet();
  const [authenticated, setAuthenticated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const authenticate = useCallback(async () => {
    if (!connected || !publicKey || !signMessage) return;
    setBusy(true);
    setError("");
    try {
      const challenge = await fetch("/api/auth/wallet/challenge", { method: "POST" }).then((r) => r.json());
      const message = `AURA wallet login\n\nSign this one-time message to enter your paper trading desk.\nNonce: ${challenge.nonce}`;
      const signature = await signMessage(new TextEncoder().encode(message));
      const result = await fetch("/api/auth/wallet/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: publicKey.toBase58(), signature: toBase64(signature) }),
      });
      const payload = await result.json();
      if (!result.ok) throw new Error(payload.error || "Wallet authentication failed.");
      setAuthenticated(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wallet authentication failed.");
    } finally {
      setBusy(false);
    }
  }, [connected, publicKey, signMessage]);

  useEffect(() => {
    if (!connected) {
      setAuthenticated(false);
      return;
    }
    fetch("/api/auth/wallet/session").then((response) => {
      if (response.ok) setAuthenticated(true);
      else void authenticate();
    });
  }, [connected, authenticate]);

  if (authenticated) return <>{children}</>;

  return (
    <main className="mx-auto flex min-h-[78vh] max-w-xl flex-col items-center justify-center gap-6 px-5 text-center">
      <div className="eyebrow text-[#00E676]">Private paper desk</div>
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#e8fff3]">Sign in with your wallet.</h1>
      <p className="max-w-md text-sm leading-6 text-[#8ba99a]">Connect a Solana wallet and sign a one-time message. Your private key never enters or leaves the wallet.</p>
      <WalletButton />
      {connected && !signMessage && <p className="text-sm text-[#9945FF]">This wallet does not support message signing.</p>}
      {busy && <p className="text-xs uppercase tracking-[0.18em] text-[#8ba99a]">Waiting for signature</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <p className="text-xs text-[#8ba99a]">Paper trading starts with a $50 simulated allocation.</p>
    </main>
  );
}
