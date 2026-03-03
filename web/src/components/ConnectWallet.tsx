

"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { WalletSelector } from './WalletSelector';
import { ArrowLeftOnRectangleIcon, WalletIcon } from '@heroicons/react/24/outline';

export default function ConnectWallet() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected, status } = useAccount();
  const { data: balanceData } = useBalance({
    address: address,
  });
  const { disconnect } = useDisconnect();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setIsSelectorOpen(true)}
          disabled={status === 'connecting'}
          className="btn btn-primary"
        >
          <WalletIcon className="w-5 h-5 mr-2" />
          {status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
        </button>
        <WalletSelector isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} />
      </>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-800/70 p-1 pl-4 rounded-xl border border-purple-500/30 backdrop-blur-sm group hover:border-purple-500/60 transition-all">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-mono text-white font-medium">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        <span className="text-xs text-purple-300">
          {balanceData ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` : '0.0000 ETH'}
        </span>
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
