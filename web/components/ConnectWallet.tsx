"use client";

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';

const ConnectWallet = () => {
  const { account, connectWallet, disconnectWallet, balance } = useWeb3();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-semibold mb-4 text-white">Connect Wallet</h2>
      {!account ? (
        <button
          onClick={connectWallet}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
        >
          Connect MetaMask
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-black/20 rounded-xl p-4">
            <p className="text-sm text-slate-300">Connected Address</p>
            <p className="font-mono text-sm text-green-400 truncate">{account}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-4">
            <p className="text-sm text-slate-300">Your DAO Balance</p>
            <p className="text-xl font-bold text-white">{balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0.0000 ETH'}</p>
          </div>
          <button
            onClick={disconnectWallet}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl transition-colors duration-200"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;