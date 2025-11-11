"use client";

import { useState } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';

const FundingPanel = () => {
  const { account, depositToDAO, userBalance, daoBalance } = useWeb3();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    if (!amount || !account) return;
    
    setLoading(true);
    try {
      await depositToDAO(amount);
      setAmount('');
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-semibold mb-4 text-white">DAO Funding</h2>
      
      <div className="space-y-4">
        <div className="bg-black/20 rounded-xl p-4">
          <p className="text-sm text-slate-300">Your Balance in DAO</p>
          <p className="text-2xl font-bold text-green-400">{userBalance ? `${userBalance} ETH` : '0.0000 ETH'}</p>
        </div>
        
        <div className="bg-black/20 rounded-xl p-4">
          <p className="text-sm text-slate-300">Total DAO Balance</p>
          <p className="text-2xl font-bold text-blue-400">{daoBalance ? `${daoBalance} ETH` : '0.0000 ETH'}</p>
        </div>

        {account && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Deposit Amount (ETH)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 rounded-xl px-4 py-3 bg-black/20 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                step="0.01"
                min="0"
                disabled={loading}
              />
              <button
                onClick={handleDeposit}
                disabled={!amount || loading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
              >
                {loading ? 'Depositing...' : 'Deposit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundingPanel;