'use client';

import { useState } from 'react';
import { VoteType, Proposal } from './ProposalList';
import { useViem } from '@/hooks/useViem';
import { waitForTransactionReceipt, parseEther } from 'viem';
import { Env } from '@/utils/config';

interface CreateProposalProps {
  onCreateProposal: (proposal: Proposal) => void;
  userVotePercentage: number;
}

export default function CreateProposal({ 
  onCreateProposal, 
  userVotePercentage 
}: CreateProposalProps) {
  const { wallet } = useViem();
  const [beneficiary, setBeneficiary] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Minimum balance required (10% of total votes)
  const minRequiredBalance = 10;
  const canCreateProposal = userVotePercentage >= minRequiredBalance;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!beneficiary.trim()) {
      newErrors.beneficiary = 'Beneficiary address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(beneficiary.trim())) {
      newErrors.beneficiary = 'Please enter a valid Ethereum address';
    }
    
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(deadline);
      const minDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // Minimum 24 hours from now
      
      if (deadlineDate < minDeadline) {
        newErrors.deadline = 'Deadline must be at least 24 hours from now';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // In a real implementation, this would connect to viem directly
      // For now, we'll simulate a successful transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newProposal: Proposal = {
        id: Date.now(),
        title: `Proposal ${Date.now()}`,
        description,
        creator: wallet.address || '0x...',
        voteCount: 0,
        deadline: new Date(deadline),
        status: 'pending',
      };
      
      onCreateProposal(newProposal);
      
      // Reset form
      setBeneficiary('');
      setAmount('');
      setDescription('');
      setDeadline('');
      setTransactionHash('0x123...456');
      
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      setErrors({ form: error.message || 'Failed to create proposal. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Proposal</h2>
      
      {!canCreateProposal ? (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Insufficient Voting Power</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  You need at least <strong>{minRequiredBalance}% voting power</strong> to create a proposal.
                  Your current voting power: <strong>{userVotePercentage.toFixed(2)}%</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="beneficiary" className="block text-sm font-medium text-gray-700 mb-2">
            Beneficiary Address
          </label>
          <input
            type="text"
            id="beneficiary"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            disabled={!canCreateProposal || isSubmitting}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors duration-200 ${errors.beneficiary ? 'border-red-500' : ''}`}
            placeholder="0x..."
          />
          {errors.beneficiary && <p className="mt-1 text-sm text-red-600">{errors.beneficiary}</p>}
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (ETH)
          </label>
          <div className="relative">
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!canCreateProposal || isSubmitting}
              step="0.01"
              min="0"
              className={`w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors duration-200 ${errors.amount ? 'border-red-500' : ''}`}
              placeholder="0.0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 text-sm font-medium">ETH</span>
            </div>
          </div>
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        </div>

        <div>
          <label htmlFor="description" className