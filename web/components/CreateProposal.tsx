"use client";

import { useState } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';

const CreateProposal = () => {
  const { account, createProposal, userBalance, daoBalance } = useWeb3();
  const [beneficiary, setBeneficiary] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('86400'); // 24 hours default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!beneficiary || !amount || !duration) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await createProposal(beneficiary, amount, parseInt(duration));
      
      // Reset form
      setBeneficiary('');
      setAmount('');
      setDuration('86400');
    } catch (err: any) {
      setError(err.message || 'Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has at least 10% of DAO balance
  const hasRequiredBalance = daoBalance && userBalance && 
    parseFloat(userBalance) >= parseFloat(daoBalance) * 0.1;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-semibold mb-4 text-white">Create Proposal</h2>
      
      {!account ? (
        <p className="text-slate-300">Connect your wallet to create proposals</p>
      ) : !hasRequiredBalance ? (
        <p className="text-yellow-400">You need at least 10% of the total DAO balance to create a proposal</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Beneficiary Address
            </label>
            <input
              type="text"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-xl px-4 py-3 bg-black/20 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount (ETH)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.01"
              min="0"
              className="w-full rounded-xl px-4 py-3 bg-black/20 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Voting Duration (seconds)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl px-4 py-3 bg-black/20 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="86400">24 hours</option>
              <option value="172800">48 hours</option>
              <option value="604800">1 week</option>
              <option value="2592000">30 days</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
          >
            {loading ? 'Creating Proposal...' : 'Create Proposal'}
          </button>
        </form>
      )}
    </div>
  );
};

export default CreateProposal;