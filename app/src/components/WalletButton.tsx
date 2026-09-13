"use client";

import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Select wallet"
        className="wallet-adapter-button wallet-adapter-button-trigger"
      >
        Select Wallet
      </button>
    );
  }

  return <WalletMultiButton />;
}
