"use client";

import { useMemo, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { AppProvider } from "@solana/connector/react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { getRpcEndpoint, getNetwork } from "@/lib/rpc";

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => getRpcEndpoint(), []);
  const network = useMemo(() => getNetwork(), []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: network as any }),
      new LedgerWalletAdapter(),
    ],
    [network]
  );

  return (
    <AppProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </AppProvider>
  );
}
