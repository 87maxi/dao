import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { WagmiProviderWrapper } from "../components/WagmiProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DAO Web3 - DeFi Governance",
  description: "A decentralized autonomous organization with gasless voting and DAO treasury management."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProviderWrapper>{children}</WagmiProviderWrapper>
      </body>
    </html>
  );
}