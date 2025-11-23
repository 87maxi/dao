"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';

interface FundingPanelProps {
  daoBalance?: string;
  userBalance?: string;
}

export default function FundingPanel({ daoBalance = '0', userBalance = '0' }: FundingPanelProps) {
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const handleDeposit = async () => {
    if (!address || !walletClient || !amount) return;
    
    setIsDepositing(true);
    setStatus('idle');
    setTxHash(null);
    
    try {
      // Simulate the transaction first
      const { request } = await publicClient.simulateContract({
        // This would be the actual DAO contract address
        address: '0xCf7Ed3AccA5a467a9e062Ec7e4784bF65048d170',
        // This ABI would need to be imported
        abi: [],
        functionName: 'deposit',
        account: address,
        value: parseEther(amount)
      });
      
      // Send the transaction
      const hash = await walletClient.writeContract(request);
      setTxHash(hash);
      setStatus('success');
      
    } catch (error) {
      console.error('Deposit error:', error);
      setStatus('error');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
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
        Funding Panel
      </h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
          <p className="text-sm text-purple-300 mb-1">Your DAO Balance</p>
          <p className="text-2xl font-bold text-white">{userBalance} ETH</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
          <p className="text-sm text-purple-300 mb-1">DAO Treasury</p>
          <p className="text-2xl font-bold text-white">{daoBalance} ETH</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-purple-200 mb-2">
            Deposit Amount (ETH)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={() => setAmount('')}
              className="btn btn-outline px-4 py-3"
              disabled={!amount}
            >
              Clear
            </button>
          </div>
        </div>

        <button
          onClick={handleDeposit}
          disabled={isDepositing || !amount}
          className="btn btn-primary w-full"
        >
          {isDepositing ? 'Confirming...' : isDepositing ? 'Processing...' : isDepositing ? 'Deposited!' : 'Deposit to DAO'}
        </button>

        {status === 'success' && txHash && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Deposit successful! <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" className="underline hover:text-green-300">View transaction</a>
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Failed to deposit funds. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}