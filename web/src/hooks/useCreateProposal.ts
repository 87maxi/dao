'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { useWalletClient } from 'wagmi';

// Types
import { ProposalForm } from '@/types/dao';
import DAOVoting from '@/contracts/abis/DAOVoting.json';

interface UseCreateProposal {
  createProposal: (data: ProposalForm) => Promise<`0x${string}` | null>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

// Extraer solo el ABI del archivo JSON
const DAOVotingABI = DAOVoting;

export function useCreateProposal(): UseCreateProposal {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: walletClient } = useWalletClient();

  const reset = () => {
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  };

  const createProposal = async (data: ProposalForm): Promise<`0x${string}` | null> => {
    if (!walletClient) {
      const err = new Error('Wallet client not available');
      setError(err);
      setIsError(true);
      throw err;
    }

    // Validación adicional de datos
    if (!data.description?.trim()) {
      const err = new Error('Proposal description is required');
      setError(err);
      setIsError(true);
      throw err;
    }

    setIsPending(true);
    setIsError(false);
    setError(null);
    setIsSuccess(false);

    try {
      console.log('Creating proposal with data:', data);

      // Enviar la transacción usando el wallet client de wagmi
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_DAO_ADDRESS as Address,
        abi: DAOVotingABI,
        functionName: 'createProposal',
        args: [data.description.trim()],
        chain: undefined,
      } as any);

      console.log('Proposal created successfully with hash:', hash);
      setIsSuccess(true);
      return hash;
    
    } catch (err) {
      const error = err as Error;
      console.error('Error creating proposal:', error);
      
      // Mejor manejo de errores
      let errorMessage = 'Failed to create proposal';
      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user';
      }
      
      const formattedError = new Error(errorMessage);
      setError(formattedError);
      setIsError(true);
      throw formattedError;
    } finally {
      setIsPending(false);
    }
  };

  return {
    createProposal,
    isPending,
    isSuccess,
    isError,
    error,
    reset,
  };
}

export default useCreateProposal;
