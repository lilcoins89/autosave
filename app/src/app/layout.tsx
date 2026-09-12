import type { Metadata } from "next";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletProvider";
import "@solana/wallet-adapter-react-ui/styles.css";

export const metadata: Metadata = {
  title: "AutoSave — Powered by AURA",
  description:
    "Intelligent Solana capital management. Define your policy. AURA maintains allocations, scores opportunities, and protects your capital.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-950 text-zinc-100">
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
