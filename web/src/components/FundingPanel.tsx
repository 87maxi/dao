"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useWalletClient, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";

export default function FundingPanel() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Get treasury balance with its loading state
  const {
    data: treasuryBalance,
    isLoading: isTreasuryLoading,
    refetch: refetchTreasury,
  } = useBalance({
    address: process.env.NEXT_PUBLIC_DAO_ADDRESS as `0x${string}`,
  });

  // Get user's balance with its loading state
  const {
    data: userBalance,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useBalance({
    address: address,
  });

  // Memoized, defensive function to compute the treasury balance string
  const treasuryBalanceDisplay = useMemo(() => {
    if (isTreasuryLoading) return "Loading...";
    if (treasuryBalance && typeof treasuryBalance.value === "bigint") {
      const etherString = formatEther(treasuryBalance.value);
      const numericBalance = parseFloat(etherString);
      if (!isNaN(numericBalance)) {
        return `${numericBalance.toFixed(4)} ETH`;
      }
    }
    return "0.0000 ETH";
  }, [isTreasuryLoading, treasuryBalance]);

  // Memoized, defensive function to compute the user balance string
  const userBalanceDisplay = useMemo(() => {
    if (isUserLoading) return "Loading...";
    if (userBalance && typeof userBalance.value === "bigint") {
      const etherString = formatEther(userBalance.value);
      const numericBalance = parseFloat(etherString);
      if (!isNaN(numericBalance)) {
        return `${numericBalance.toFixed(4)} ETH`;
      }
    }
    return "0.0000 ETH";
  }, [isUserLoading, userBalance]);

  const handleDeposit = async () => {
    if (!address || !walletClient || !amount || !isConnected) {
      setStatus("error");
      return;
    }

    setIsDepositing(true);
    setStatus("idle");
    setTxHash(null);

    try {
      // Call the `fund` function on the DAO contract
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_DAO_ADDRESS as `0x${string}`,
        abi: [
          {
            type: "function",
            name: "fund",
            inputs: [],
            outputs: [],
            stateMutability: "payable",
          },
        ],
        functionName: "fund",
        value: parseEther(amount),
      } as any);

      setTxHash(hash);
      setStatus("success");
      setAmount(""); // Clear amount after successful deposit

      // Refetch balances after successful deposit
      setTimeout(() => {
        refetchTreasury();
        refetchUser();
      }, 2000); // Wait for transaction to be mined
    } catch (error) {
      console.error("Deposit error:", error);
      setStatus("error");
    } finally {
      setIsDepositing(false);
    }
  };

  // Auto-refresh balances every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTreasury();
      if (address) refetchUser();
    }, 10000);

    return () => clearInterval(interval);
  }, [address, refetchTreasury, refetchUser]);

  if (!mounted) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 sticky top-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-purple-400"
        >
          <path d="M12 2v4"></path>
          <path d="m16.2 7.8 2.1-2.1"></path>
          <path d="M18 12h4"></path>
          <path d="m16.2 16.2 2.1 2.1"></path>
          <path d="M12 18v4"></path>
          <path d="m4.9 19.1 2.1-2.1"></path>
          <path d="M2 12h4"></path>
          <path d="m4.9 4.9 2.1 2.1"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        Treasury
      </h2>

      <div className="space-y-4 mb-6">
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
          <p className="text-sm text-purple-300 mb-1">DAO Treasury</p>
          <p className="text-3xl font-bold text-white">
            {treasuryBalanceDisplay}
          </p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
          <p className="text-sm text-purple-300 mb-1">Your Balance</p>
          <p className="text-2xl font-bold text-white">{userBalanceDisplay}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-purple-200 mb-2"
          >
            Deposit Amount (ETH)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.01"
            min="0"
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {!isConnected ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-400 text-sm text-center">
              Connect wallet to deposit
            </p>
          </div>
        ) : (
          <button
            onClick={handleDeposit}
            disabled={isDepositing || !amount || parseFloat(amount) <= 0}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDepositing ? "Processing..." : "Deposit to DAO"}
          </button>
        )}

        {status === "success" && txHash && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Deposit successful!{" "}
              {/* The link might need adjustment based on your local network viewer */}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {!isConnected
                ? "Please connect your wallet"
                : "Failed to deposit. Please try again."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
