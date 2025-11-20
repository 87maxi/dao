import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import  useWeb3  from '@/hooks/useWeb3';
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
  ) => Promise<ethers.TransactionResponse | null>;
  createProposalMetaTx: (
    description: string
  ) => Promise<ethers.TransactionResponse | null>;
  voteMetaTx: (
    proposalId: number,
    voteType: number
  ) => Promise<ethers.TransactionResponse | null>;
}

/**
 * Hook para manejar meta-transacciones EIP-2771
 */
export default function useMetaTransactions(): UseMetaTransactionsReturns {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account, connected, getProvider, getSigner } = useWeb3();

  const isMetaTxSupported = connected && account !== null;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeMetaTransaction = useCallback(async (
    to: string,
    data: string,
    gasLimit: number = 500000
  ): Promise<ethers.TransactionResponse | null> => {
    if (!isMetaTxSupported || !account) {
      setError('Wallet no conectado o no soporta meta-transacciones');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const signer = await getSigner();
      const provider = await getProvider();
      
      if (!signer || !provider) {
        throw new Error('No se pudo obtener el signer o provider');
      }

      // Crear forward request
      const request = metaTransactionService.createForwardRequest(
        account.address,
        to,
        data,
        gasLimit
      );

      // Firmar la solicitud
      const signature = await metaTransactionService.signForwardRequest(request, signer);

      // Ejecutar la meta-transacción
      const tx = await metaTransactionService.executeMetaTransaction(
        request,
        signature,
        provider
      );

      setLoading(false);
      return tx;
    } catch (err: any) {
      console.error('Error executing meta-transaction:', err);
      setError(err.message || 'Error al ejecutar meta-transacción');
      setLoading(false);
      return null;
    }
  }, [isMetaTxSupported, account, getSigner, getProvider, clearError]);

  const createProposalMetaTx = useCallback(async (
    description: string
  ): Promise<ethers.TransactionResponse | null> => {
    if (!isMetaTxSupported || !account) {
      setError('Wallet no conectado');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const signer = await getSigner();
      const provider = await getProvider();
      
      if (!signer || !provider) {
        throw new Error('No se pudo obtener el signer o provider');
      }

      const tx = await metaTransactionService.createProposalMetaTransaction(
        account.address,
        description,
        signer,
        provider
      );

      setLoading(false);
      return tx;
    } catch (err: any) {
      console.error('Error creating proposal meta-transaction:', err);
      setError(err.message || 'Error al crear propuesta con meta-transacción');
      setLoading(false);
      return null;
    }
  }, [isMetaTxSupported, account, getSigner, getProvider, clearError]);

  const voteMetaTx = useCallback(async (
    proposalId: number,
    voteType: number
  ): Promise<ethers.TransactionResponse | null> => {
    if (!isMetaTxSupported || !account) {
      setError('Wallet no conectado');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const signer = await getSigner();
      const provider = await getProvider();
      
      if (!signer || !provider) {
        throw new Error('No se pudo obtener el signer o provider');
      }

      const tx = await metaTransactionService.createDAOVoteMetaTransaction(
        account.address,
        proposalId,
        voteType,
        signer,
        provider
      );

      setLoading(false);
      return tx;
    } catch (err: any) {
      console.error('Error voting with meta-transaction:', err);
      setError(err.message || 'Error al votar con meta-transacción');
      setLoading(false);
      return null;
    }
  }, [isMetaTxSupported, account, getSigner, getProvider, clearError]);

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