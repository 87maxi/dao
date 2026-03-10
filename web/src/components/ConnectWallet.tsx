"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { formatEther } from "viem"; // Import the specific formatter
import { WalletSelector } from "./WalletSelector";
import {
  ArrowLeftOnRectangleIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";

export default function ConnectWallet() {
  // State to prevent hydration issues with server-side rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected, status } = useAccount();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: address,
  });
  const { disconnect } = useDisconnect();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // A memoized, defensive function to compute the balance string.
  // This now manually formats the balance value using formatEther.
  const balanceDisplay = useMemo(() => {
    // 1. If the balance is actively being fetched, show a loading message.
    if (isBalanceLoading) {
      return "Fetching...";
    }

    // 2. If data has arrived, check for the `value` property (which is a BigInt).
    // This is more robust than checking for a potentially missing `formatted` property.
    if (balanceData && typeof balanceData.value === "bigint") {
      // Manually format the BigInt `value` from Wei to an Ether string.
      const etherString = formatEther(balanceData.value);
      const numericBalance = parseFloat(etherString);

      // 3. Final safety check: ensure the parsed number is not NaN before formatting.
      if (!isNaN(numericBalance)) {
        return `${numericBalance.toFixed(4)} ${balanceData.symbol}`;
      }
    }

    // 4. Fallback: If not loading and data is not ready or invalid, show a default.
    return "0.0000 ETH";
  }, [isBalanceLoading, balanceData]);

  // Avoid rendering anything until the component is mounted on the client
  if (!mounted) return null;

  // Render the "Connect Wallet" button if the user is not connected
  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setIsSelectorOpen(true)}
          disabled={status === "connecting"}
          className="btn btn-primary"
        >
          <WalletIcon className="w-5 h-5 mr-2" />
          {status === "connecting" ? "Connecting..." : "Connect Wallet"}
        </button>
        <WalletSelector
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
        />
      </>
    );
  }

  // Render the connected user's information
  return (
    <div className="flex items-center gap-3 bg-slate-800/70 p-1 pl-4 rounded-xl border border-purple-500/30 backdrop-blur-sm group hover:border-purple-500/60 transition-all">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-mono text-white font-medium">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        <span className="text-xs text-purple-300">{balanceDisplay}</span>
      </div>

      <button
        onClick={() => disconnect()}
        className="ml-2 p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
        title="Disconnect wallet"
      >
        <ArrowLeftOnRectangleIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
