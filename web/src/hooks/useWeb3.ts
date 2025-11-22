"use client"

import { useState, useEffect, useCallback } from 'react';
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useChainId,
  useSwitchChain,
  useBalance,
  usePublicClient,
  useWalletClient,
} from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { Env } from '@/utils/config';
import { ethers } from 'ethers';

// Tipos para el hook (mantenimos la misma interfaz para compatibilidad)
interface Account {
  address: string;
  balance: string;
}

interface Network {
  name: string;
  chainId: number;
}

interface UseWeb3Returns {
  account: Account | null;
  network: Network | null;
  connected: boolean;
  loading: boolean;
  networkError: string | null;
  isMetaMaskInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  getProvider: () => ethers.JsonRpcProvider | null;
  getSigner: () => Promise<ethers.JsonRpcSigner | null>;
  switchToAnvil: () => Promise<void>;
  isNetworkAllowed: (chainId: number) => boolean;
}

const ANVIL_CONFIG = {
  CHAIN_ID: Number(Env.CHAIN_ID) || 31337,
  CHAIN_NAME: Env.NETWORK_NAME || 'Anvil Local Network',
  RPC_URL: Env.RPC_URL || 'http://127.0.0.1:8545',
  CURRENCY: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  BLOCK_EXPLORER: ''
};

const ALLOWED_CHAIN_IDS = [ANVIL_CONFIG.CHAIN_ID];

/**
 * Hook personalizado para gestionar la conexión con Web3 usando wagmi
 */
export default function useWeb3(): UseWeb3Returns {
  const [networkError, setNetworkError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Usamos los hooks de wagmi
  const { address, isConnected, isConnecting } = useAccount();
  const { connect: wagmiConnect, connectors, error: connectError } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balanceData } = useBalance({
    address: address,
  });

  // Obtenemos el provider de ethers directamente
  const getProvider = useCallback((): ethers.JsonRpcProvider | null => {
    try {
      return new ethers.JsonRpcProvider(Env.RPC_URL);
    } catch (error) {
      console.error('Error creating ethers provider:', error);
      return null;
    }
  }, []);

  const getSigner = useCallback(async (): Promise<ethers.JsonRpcSigner | null> => {
    if (!address) return null;
    
    try {
      const provider = getProvider();
      if (!provider) return null;
      
      return provider.getSigner(address);
    } catch (error) {
      console.error('Error getting signer:', error);
      return null;
    }
  }, [address, getProvider]);

  const formatBalance = useCallback((balance: bigint | undefined, decimals = 18): string => {
    if (!balance) return '0.0000';
    return Number(Number(balance.toString()) / 10 ** decimals).toFixed(4);
  }, []);

  const getNetworkName = useCallback((chainId: number): string => {
    const networkNames: { [key: number]: string } = {
      31337: 'Anvil Local Network',
      1337: 'Ganache Local Network'
    };
    return networkNames[chainId] || `Red Desconocida (${chainId})`;
  }, []);

  const isNetworkAllowed = useCallback((chainId: number): boolean => {
    return ALLOWED_CHAIN_IDS.includes(chainId);
  }, []);

  // Sincronizamos el estado con wagmi
  useEffect(() => {
    if (connectError) {
      setNetworkError(connectError.message);
    } else {
      setNetworkError(null);
    }
  }, [connectError]);

  const isMetaMaskInstalled = connectors.some(
    connector => connector.name === 'MetaMask'
  );

  const account: Account | null = address ? {
    address,
    balance: formatBalance(balanceData?.value)
  } : null;

  const currentNetwork: Network | null = chainId ? {
    name: getNetworkName(chainId),
    chainId: chainId
  } : null;

  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setNetworkError('No se detectó un wallet Ethereum. Por favor instala MetaMask o otro wallet compatible.');
      return;
    }

    try {
      const metaMaskConnector = connectors.find(
        connector => connector.name === 'MetaMask'
      );
      
      if (metaMaskConnector) {
        wagmiConnect({ connector: metaMaskConnector });
      }
    } catch (error: any) {
      console.error('Error conectando con MetaMask:', error);
      setNetworkError('Error al conectar con el wallet: ' + (error.message || 'Error desconocido'));
    }
  }, [isMetaMaskInstalled, connectors, wagmiConnect]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    queryClient.clear();
  }, [wagmiDisconnect, queryClient]);

  const switchToAnvil = useCallback(async (): Promise<void> => {
    if (!switchChain) {
      throw new Error('No se puede cambiar de red');
    }
    
    try {
      await switchChain({ chainId: ANVIL_CONFIG.CHAIN_ID });
    } catch (error: any) {
      console.error('Error cambiando a red Anvil:', error);
      throw error;
    }
  }, [switchChain]);

  return {
    account,
    network: currentNetwork,
    connected: isConnected,
    loading: isConnecting,
    networkError,
    isMetaMaskInstalled,
    connect,
    disconnect,
    getProvider,
    getSigner,
    switchToAnvil,
    isNetworkAllowed
  };
}
