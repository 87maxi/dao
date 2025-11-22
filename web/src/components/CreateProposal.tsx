"use client";

import { useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { encodeFunctionData } from 'viem';
import { Env } from '@/utils/config';
import DAOVotingABI from '@/contracts/abis/DAOVoting.json';

/**
 * Props para el componente CreateProposal
 */
interface CreateProposalProps {
  onCreateProposal: (
    title: string, 
    description: string, 
    deadline: Date,
    recipientAddress: string,
    isGasless: boolean
  ) => void;
  disabled?: boolean;
}

/**
 * Componente para crear una nueva propuesta en el DAO
 * Diseño responsive con Tailwind CSS
 */
export default function CreateProposal({ onCreateProposal, disabled = false }: CreateProposalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isGasless, setIsGasless] = useState(false);
  const [deadline, setDeadline] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>('');

  // Hooks de wagmi para interactuar con la blockchain
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  /**
   * Valida los campos del formulario
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!recipientAddress.trim()) {
      newErrors.recipientAddress = 'Recipient address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      newErrors.recipientAddress = 'Please enter a valid Ethereum address';
    }
    
    if (!deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(deadline);
      const minDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // Mínimo 24 horas desde ahora
      
      if (deadlineDate < minDeadline) {
        newErrors.deadline = 'Deadline must be at least 24 hours from now';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Crea la propuesta en la blockchain
   */
  const createProposalOnChain = async (): Promise<string> => {
    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    try {
      // Encode the function call
      const data = encodeFunctionData({
        abi: DAOVotingABI,
        functionName: 'createProposal',
        args: [description]
      });

      // Send the transaction
      const hash = await walletClient.writeContract({
        address: Env.DAO_VOTING_ADDRESS as `0x${string}`,
        abi: DAOVotingABI,
        functionName: 'createProposal',
        args: [description],
      });

      setTransactionHash(hash);
      
      // Wait for transaction confirmation
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success') {
          throw new Error('Transaction failed');
        }
      }

      return hash;
    } catch (error) {
      console.error('Error creating proposal on chain:', error);
      throw error;
    }
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      // Primero crear la propuesta en la blockchain
      await createProposalOnChain();
      
      // Si llegamos aquí, la transacción fue enviada exitosamente
      // Ahora llamamos al callback del padre con los datos
      await onCreateProposal(
        title, 
        description, 
        new Date(deadline),
        recipientAddress,
        isGasless
      );

      // Reiniciar el formulario
      setTitle('');
      setDescription('');
      setRecipientAddress('');
      setIsGasless(false);
      setErrors({});
      setTransactionHash('');
    } catch (error) {
      console.error('Error creating proposal:', error);
      setErrors({ form: 'Failed to create proposal. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Proposal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={disabled || submitting}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 
                     disabled:cursor-not-allowed transition-colors duration-200"
            placeholder="Enter proposal title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled || submitting}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 
                     disabled:cursor-not-allowed transition-colors duration-200 resize-vertical"
            placeholder="Describe your proposal in detail"
          ></textarea>
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            id="recipientAddress"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            disabled={disabled || submitting}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 
                     disabled:cursor-not-allowed transition-colors duration-200 font-mono text-sm"
            placeholder="0x..."
          />
          {errors.recipientAddress && <p className="mt-1 text-sm text-red-600">{errors.recipientAddress}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Enter the Ethereum address that will receive the funds if the proposal passes
          </p>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="checkbox"
            id="gasless"
            checked={isGasless}
            onChange={(e) => setIsGasless(e.target.checked)}
            disabled={disabled || submitting}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 
                     focus:ring-2 disabled:bg-gray-200 disabled:cursor-not-allowed"
          />
          <div className="flex-1">
            <label htmlFor="gasless" className="text-sm font-medium text-gray-700 cursor-pointer">
              Gasless Voting
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Enable gasless voting for this proposal. Users won't need to pay gas fees to vote.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
            Voting Deadline
          </label>
          <input
            type="date"
            id="deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={disabled || submitting}
            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 
                     disabled:cursor-not-allowed transition-colors duration-200"
          />
          {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
        </div>

        {errors.form && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{errors.form}</div>}
        
        {transactionHash && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            Transaction sent! Hash: {transactionHash}
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || submitting || !walletClient}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 
                   hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 
                   rounded-lg shadow-lg transform transition-all duration-200 
                   hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed 
                   disabled:transform-none flex items-center justify-center"
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Proposal...
            </>
          ) : (
            <>Create Proposal</>
          )}
        </button>

        {!walletClient && (
          <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
            Please connect your wallet to create a proposal
          </div>
        )}
      </form>
    </div>
  );
}