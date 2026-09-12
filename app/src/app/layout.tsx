import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletProvider";
import { MobileNav } from "@/components/MobileNav";
import "@solana/wallet-adapter-react-ui/styles.css";

export const metadata: Metadata = {
  title: "AutoSave — Intelligent capital, safely deployed",
  description:
    "AURA is a Solana-native capital policy engine for saving, automated buying, copy strategies, DCA, and safety-first execution.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-950 text-zinc-100 pb-16 md:pb-0">
        <WalletContextProvider>
          {children}
          <MobileNav />
        </WalletContextProvider>
      </body>
    </html>
  );
}
