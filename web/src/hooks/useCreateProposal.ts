'use client';

import { useState } from 'react';
import { Address, createWalletClient, custom, parseEther } from 'viem';
import { base } from 'viem/chains';

// Types
import { ProposalForm } from '@/types/dao';
import DAOVoting from '@/lib/contracts/DAOVoting.json';

interface UseCreateProposal {
  createProposal: (data: ProposalForm) => Promise<`0x${string}` | null>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

// Extraer solo el ABI del archivo JSON
const DAOVotingABI = DAOVoting.abi;

export function useCreateProposal(): UseCreateProposal {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = () => {
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  };

  const createProposal = async (data: ProposalForm): Promise<`0x${string}` | null> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      const err = new Error('Ethereum provider not found');
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

      // Crear wallet client con viem
      const walletClient = createWalletClient({
        chain: {
          id: 31337,
          name: 'anvil',
          nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
          rpcUrls: { 
            default: { http: ['http:localhost:8545'] }, 
            public: { http: ['http:localhost:8545'] } 
          },
          testnet: true
        },
        transport: custom(window.ethereum)
      });

      // Obtener la cuenta conectada
      const [address] = await walletClient.getAddresses();
      
      if (!address) {
        throw new Error('No connected account found');
      }

      // Enviar la transacción directamente con viem
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_DAO_ADDRESS as Address,
        abi: DAOVotingABI,
        functionName: 'createProposal',
        args: [data.description.trim()],
        account: address
      });

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

