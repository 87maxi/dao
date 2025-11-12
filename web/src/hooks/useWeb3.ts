"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Tipos para el hook
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
  connect: () => Promise<void>;
  disconnect: () => void;
  getProvider: () => ethers.BrowserProvider | null;
  getSigner: () => Promise<ethers.Signer | null>;
  switchNetwork: (chainId: number) => Promise<void>;
  addNetwork: (network: { chainId: number; chainName: string; rpcUrl: string; currency: { name: string; symbol: string; decimals: number }; blockExplorerUrl?: string }) => Promise<void>;
}

// Tipo para la ventana extendida con Ethereum
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  send: (method: string, params?: any[]) => Promise<any>;
}

interface ExtendedWindow extends Window {
  ethereum?: EthereumProvider;
}

declare const window: ExtendedWindow;

/**
 * Hook personalizado para gestionar la conexión con Web3 y MetaMask
 */
export default function useWeb3(): UseWeb3Returns {
  const [account, setAccount] = useState<Account | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Objeto provider para reutilizar
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  // Obtener provider
  const getProvider = useCallback((): ethers.BrowserProvider | null => {
    if (typeof window !== 'undefined' && window.ethereum) {
      if (!provider) {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(newProvider);
        return newProvider;
      }
      return provider;
    }
    return null;
  }, [provider]);

  // Obtener signer
  const getSigner = useCallback(async (): Promise<ethers.Signer | null> => {
    const currentProvider = getProvider();
    if (currentProvider) {
      try {
        return await currentProvider.getSigner();
      } catch (error) {
        console.error('Error getting signer:', error);
        return null;
      }
    }
    return null;
  }, [getProvider]);

  // Formatear balance
  const formatBalance = (balance: bigint, decimals = 18): string => {
    return Number(ethers.formatUnits(balance, decimals)).toFixed(4);
  };

  // Formatear nombre de red
  const getNetworkName = (chainId: number): string => {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai',
      31337: 'Hardhat Network',
      31338: 'Anvil Network'
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  // Actualizar estado de la cuenta
  const updateAccount = useCallback(async (address: string) => {
    const currentProvider = getProvider();
    if (!currentProvider) return;

    try {
      const balance = await currentProvider.getBalance(address);
      setAccount({
        address,
        balance: formatBalance(balance)
      });
    } catch (error) {
      console.error('Error fetching account balance:', error);
      setAccount({
        address,
        balance: '0.0000'
      });
    }
  }, [getProvider]);

  // Actualizar estado de red
  const updateNetwork = useCallback(async (chainId: number) => {
    setNetwork({
      name: getNetworkName(chainId),
      chainId
    });
  }, []);

  // Configurar listeners de eventos
  const setupListeners = useCallback(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const ethereum = window.ethereum;

    // Listener para cambio de cuentas
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Usuario desconectó la cuenta
        disconnect();
      } else {
        // Usuario cambió de cuenta
        updateAccount(accounts[0]);
      }
    };

    // Listener para cambio de red
    const handleChainChanged = (chainIdHex: string) => {
      // chainChanged event provides chainId as hex string
      const chainId = parseInt(chainIdHex, 16);
      updateNetwork(chainId);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // Cleanup function
    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [updateAccount, updateNetwork, disconnect]);

  // Conectar con MetaMask
  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    setLoading(true);
    try {
      if (!window.ethereum) {
        alert('MetaMask is not installed. Please install it to use this app.');
        setLoading(false);
        return;
      }

      const currentProvider = getProvider();
      if (!currentProvider) {
        setLoading(false);
        return;
      }

      // Solicitar cuentas
      const accounts = await currentProvider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Obtener chainId
      const network = await currentProvider.getNetwork();
      const chainId = Number(network.chainId);

      // Actualizar estados
      await updateAccount(accounts[0]);
      await updateNetwork(chainId);
      
      setConnected(true);

      // Configurar listeners
      setupListeners();
      
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      alert('Failed to connect to wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getProvider, updateAccount, updateNetwork, setupListeners]);

  // Desconectar
  const disconnect = useCallback(() => {
    setAccount(null);
    setNetwork(null);
    setConnected(false);
    setProvider(null);
  }, []);

  // Cambiar de red
  const switchNetwork = useCallback(async (chainId: number) => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: unknown) {
      console.error('Error switching network:', error);
      const switchError = error as { code?: number };
      if (switchError.code === 4902) {
        throw new Error('Network not added to wallet');
      }
      throw error;
    }
  }, []);

  // Añadir nueva red
  const addNetwork = useCallback(async (networkConfig: { 
    chainId: number; 
    chainName: string; 
    rpcUrl: string; 
    currency: { name: string; symbol: string; decimals: number }; 
    blockExplorerUrl?: string 
  }) => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${networkConfig.chainId.toString(16)}`,
          chainName: networkConfig.chainName,
          rpcUrls: [networkConfig.rpcUrl],
          nativeCurrency: networkConfig.currency,
          blockExplorerUrls: networkConfig.blockExplorerUrl ? [networkConfig.blockExplorerUrl] : []
        }],
      });
    } catch (error) {
      console.error('Error adding network:', error);
      throw error;
    }
  }, []);

  // Efecto para cargar estado inicial si ya está conectado
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return;

      try {
        const currentProvider = getProvider();
        if (!currentProvider) return;

        const accounts = await currentProvider.send('eth_accounts', []);
        if (accounts.length > 0) {
          const network = await currentProvider.getNetwork();
          const chainId = Number(network.chainId);
          
          await updateAccount(accounts[0]);
          await updateNetwork(chainId);
          setConnected(true);
          setupListeners();
        }
      } catch (error) {
        console.error('Error checking initial connection:', error);
      }
    };

    checkConnection();
  }, [getProvider, updateAccount, updateNetwork, setupListeners]);

  return {
    account,
    network,
    connected,
    loading,
    connect,
    disconnect,
    getProvider,
    getSigner,
    switchNetwork,
    addNetwork
  };
}
