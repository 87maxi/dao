"use client";

import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { Header } from '@/components';

export const metadata = {
  title: "DAO Web3 - DeFi Governance",
  description: "A decentralized autonomous organization with gasless voting and DAO treasury management."
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </body>
    </html>
  );
}