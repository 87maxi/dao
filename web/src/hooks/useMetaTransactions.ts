import { useState, useCallback } from 'react';
import useWeb3 from '@/hooks/useWeb3';
import { metaTransactionService, ForwardRequest } from '@/utils/metaTransactions';
import { Env } from '@/utils/config';

interface UseMetaTransactionsReturns {
  isMetaTxSupported: boolean;
  loading: boolean;
  error: string | null;
  executeMetaTransaction: (
    to: string,
    data: string,
    gasLimit?: number
  ) => Promise<unknown | null>;
  createProposalMetaTx: (
    description: string
  ) => Promise<unknown | null>;
  voteMetaTx: (
    proposalId: number,
    voteType: number
  ) => Promise<unknown | null>;
}

/**
 * Hook para manejar meta-transacciones EIP-2771
 */
export default function useMetaTransactions(): UseMetaTransactionsReturns {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account, connected, getSigner } = useWeb3();

  const isMetaTxSupported = connected && account !== null;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeMetaTransaction = useCallback(async (
    to: string,
    data: string,
    gasLimit: number = 500000
  ): Promise<unknown | null> => {
    if (!isMetaTxSupported || !account) {
      setError('Wallet no conectado o no soporta meta-transacciones');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      // Get signer (compatible con wagmi)
      const signer = await getSigner();
      
      // Crear forward request
      const request = metaTransactionService.createForwardRequest(
        account.address,
        to,
        data,
        gasLimit
      );

      // Execute the meta-transaction - the metaTransactionService now handles the logic
      const tx = await metaTransactionService.executeMetaTransaction(request, await signer);

      setLoading(false);
      return tx;
    } catch (err: any) {
      console.error('Error executing meta-transaction:', err);
      setError(err.message || 'Error al ejecutar meta-transacción');
      setLoading(false);
      return null;
    }
  }, [isMetaTxSupported, account, getSigner, clearError]);

  const createProposalMetaTx = useCallback(async (
    description: string
  ): Promise<unknown | null> => {
    if (!isMetaTxSupported || !account) {
      setError('Wallet no conectado');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      // Create proposal meta-transaction - the logic is now in metaTransactionService
      const tx = await metaTransactionService.createProposalMetaTransaction(
        account.address,
        description
      );

      setLoading(false);
      return tx;
    } catch (err: any) {
      console.error('Error creating proposal meta-transaction:', err);
      setError(err.message || 'Error al crear propuesta con meta-transacción');
      setLoading(false);
      return null;
    }
  }, [isMetaTxSupported, account]);

  const voteMetaTx = useCallback(async (
    proposalId: number,
    voteType: number
  ): Promise<unknown | null> => {
    if (!isMetaTxSupported || !account) {
      setError('Wallet no conectado');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      // Create DAO vote meta-transaction - logic now in metaTransactionService
      const tx = await metaTransactionService.createDAOVoteMetaTransaction(
        account.address,
        proposalId,
        voteType
      );

      setLoading(false);
      return tx;
    } catch (err: any) {
      console.error('Error voting with meta-transaction:', err);
      setError(err.message || 'Error al votar con meta-transacción');
      setLoading(false);
      return null;
    }
  }, [isMetaTxSupported, account]);

  return {
    isMetaTxSupported,
    loading,
    error,
    executeMetaTransaction,
    createProposalMetaTx,
    voteMetaTx
  };
}

/**
 * Helper para verificar si la red soporta meta-transacciones
 */
export const isMetaTransactionSupported = (chainId: number): boolean => {
  return chainId === Env.CHAIN_ID; // Solo soportamos meta-transacciones en la red local de desarrollo
};

/**
 * Helper para obtener el forwarder address de la red actual
 */
export const getForwarderAddress = (): string => {
  return Env.FORWARDER_CONTRACT_ADDRESS;
};