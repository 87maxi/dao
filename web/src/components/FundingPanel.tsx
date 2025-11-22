'use client';

import { useState } from 'react';

interface FundingPanelProps {
  userBalance: string;
  daoBalance: string;
  onDeposit: (amount: string) => void;
  isLoading?: boolean;
}

export default function FundingPanel({
  userBalance,
  daoBalance,
  onDeposit,
  isLoading = false
}: FundingPanelProps) {
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    
    setIsDepositing(true);
    try {
      await onDeposit(amount);
      setAmount('');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleMax = () => {
    setAmount(userBalance);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">DAO Funding</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-1">
            Your Balance
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {userBalance} ETH
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm font-semibold text-green-800 uppercase tracking-wider mb-1">
            DAO Balance
          </div>
          <div className="text-2xl font-bold text-green-900">
            {daoBalance} ETH
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deposit to DAO
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                min="0"
                disabled={isDepositing}
                className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">ETH</span>
              </div>
            </div>
            <button
              onClick={handleMax}
              disabled={isDepositing}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
            >
              Max
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDeposit}
          disabled={isDepositing || !amount || Number(amount) <= 0 || isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDepositing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Depositing...</span>
            </div>
          ) : (
            <span>Deposit to DAO</span>
          )}
        </button>
      </div>
    </div>
  );
}