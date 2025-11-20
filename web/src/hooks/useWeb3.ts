"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { Env } from '@/utils/config';

// Tipos para el hook (igual que antes)
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
  getProvider: () => ethers.BrowserProvider | null;
  getSigner: () => Promise<ethers.Signer | null>;
  switchToAnvil: () => Promise<void>;
  isNetworkAllowed: (chainId: number) => boolean;
}

// ✅ MOVER CONSTANTES FUERA DEL COMPONENTE para evitar recreación
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

// Tipo para Ethereum Provider (igual que antes)
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  selectedAddress?: string | null;
  chainId?: string;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

/**
 * Hook personalizado para gestionar la conexión con Web3 y MetaMask
 */
export default function useWeb3(): UseWeb3Returns {
  const [account, setAccount] = useState<Account | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  // ✅ Usar useRef para el provider para evitar recreación
  const providerRef = useRef<ethers.BrowserProvider | null>(null);

  /**
   * VERIFICACIÓN COMPATIBLE DE WALLET - ✅ SIN DEPENDENCIAS
   */
  const checkMetaMaskInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return !!window.ethereum && typeof window.ethereum.request === 'function';
  }, []); // ✅ Sin dependencias

  /**
   * VERIFICAR SI UNA RED ESTÁ PERMITIDA - ✅ SIN DEPENDENCIAS
   */
  const isNetworkAllowed = useCallback((chainId: number): boolean => {
    return ALLOWED_CHAIN_IDS.includes(chainId);
  }, []); // ✅ Sin dependencias

  /**
   * OBTENER PROVIDER - ✅ DEPENDENCIAS ESTABLES
   */
  const getProvider = useCallback((): ethers.BrowserProvider | null => {
    if (!isMetaMaskInstalled || !window.ethereum) return null;

    if (!providerRef.current) {
      providerRef.current = new ethers.BrowserProvider(window.ethereum);
    }
    return providerRef.current;
  }, [isMetaMaskInstalled]); // ✅ Solo depende de isMetaMaskInstalled

  /**
   * OBTENER SIGNER - ✅ DEPENDENCIAS ESTABLES
   */
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
  }, [getProvider]); // ✅ Dependencia estable

  /**
   * FORMATEAR BALANCE - ✅ MOVER FUERA O USAR useCallback SIN DEPENDENCIAS
   */
  const formatBalance = useCallback((balance: bigint, decimals = 18): string => {
    return Number(ethers.formatUnits(balance, decimals)).toFixed(4);
  }, []); // ✅ Sin dependencias

  /**
   * FORMATEAR NOMBRE DE RED - ✅ SIN DEPENDENCIAS
   */
  const getNetworkName = useCallback((chainId: number): string => {
    const networkNames: { [key: number]: string } = {
      'anvil' : chainId
    };
    return networkNames[chainId] || `Red Desconocida (${chainId})`;
  }, []); // ✅ Sin dependencias

  /**
   * ACTUALIZAR ESTADO DE LA CUENTA - ✅ DEPENDENCIAS ESTABLES
   */
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
      console.error('Error obteniendo balance:', error);
      setAccount({
        address,
        balance: '0.0000'
      });
    }
  }, [getProvider, formatBalance]); // ✅ Dependencias estables

  /**
   * ACTUALIZAR ESTADO DE RED - ✅ DEPENDENCIAS ESTABLES
   */
  const updateNetwork = useCallback(async (chainId: number) => {
    const networkName = getNetworkName(chainId);
    setNetwork({
      name: networkName,
      chainId
    });

    if (!isNetworkAllowed(chainId)) {
      setNetworkError(`Red no permitida: ${networkName}. Solo se permiten redes locales (Anvil: 31337)`);
    } else {
      setNetworkError(null);
    }
  }, [getNetworkName, isNetworkAllowed]); // ✅ Dependencias estables

  /**
   * VERIFICAR SI YA ESTÁ CONECTADO - ✅ DEPENDENCIAS ESTABLES
   */
  const checkIfAlreadyConnected = useCallback(async (): Promise<boolean> => {
    if (!isMetaMaskInstalled || !window.ethereum) return false;

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });

      if (accounts && accounts.length > 0) {
        const currentAccount = accounts[0];
        const chainId = await window.ethereum!.request({
          method: 'eth_chainId'
        });
        const chainIdNumber = parseInt(chainId, 16);

        await updateAccount(currentAccount);
        await updateNetwork(chainIdNumber);
        setConnected(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando conexión existente:', error);
      return false;
    }
  }, [isMetaMaskInstalled, updateAccount, updateNetwork]); // ✅ Dependencias estables

  /**
   * SOLICITAR CONEXIÓN - ✅ DEPENDENCIAS ESTABLES
   */
  const requestConnection = useCallback(async (): Promise<boolean> => {
    if (!isMetaMaskInstalled || !window.ethereum) return false;

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts && accounts.length > 0) {
        const currentAccount = accounts[0];
        const chainId = await window.ethereum!.request({
          method: 'eth_chainId'
        });
        const chainIdNumber = parseInt(chainId, 16);

        await updateAccount(currentAccount);
        await updateNetwork(chainIdNumber);
        setConnected(true);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Error solicitando conexión:', error);
      if (error.code === 4001) {
        throw new Error('El usuario rechazó la conexión con el wallet');
      } else if (error.code === -32002) {
        throw new Error('Ya hay una solicitud de conexión pendiente');
      } else {
        throw new Error('Error al conectar con el wallet: ' + (error.message || 'Error desconocido'));
      }
    }
  }, [isMetaMaskInstalled, updateAccount, updateNetwork]); // ✅ Dependencias estables

  /**
   * CAMBIAR A RED ANVIL - ✅ SIN DEPENDENCIAS
   */
  const switchToAnvil = useCallback(async (): Promise<boolean> => {
    if (!isMetaMaskInstalled || !window.ethereum) {
      console.log('❌ No se puede cambiar red: Wallet no instalado');
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: Env.HEX_CHAIN_ID }],
      });
      
      return true;
    } catch (error: any) {
      console.error('Error cambiando a red Anvil:', error);
      
      if (error.code === 4902) {
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: Env.HEX_CHAIN_ID,
              chainName: Env.CHAIN_NAME,
              rpcUrls: [Env.RPC_URL],
              nativeCurrency: ANVIL_CONFIG.CURRENCY,
              blockExplorerUrls: ANVIL_CONFIG.BLOCK_EXPLORER ? [ANVIL_CONFIG.BLOCK_EXPLORER] : []
            }],
          });
          
          return true;
        } catch (addError) {
          console.error('Error agregando red Anvil:', addError);
          return false;
        }
      }
      
      return false;
    }
  }, [isMetaMaskInstalled]); // ✅ Dependencia estable

  /**
   * DESCONECTAR - ✅ SIN DEPENDENCIAS
   */
  const disconnect = useCallback(() => {
    setAccount(null);
    setNetwork(null);
    setConnected(false);
    providerRef.current = null;
    setNetworkError(null);
  }, []); // ✅ Sin dependencias

  /**
   * CONFIGURAR LISTENERS DE EVENTOS - ✅ DEPENDENCIAS ESTABLES
   */
  const setupEventListeners = useCallback(() => {
    if (!isMetaMaskInstalled || !window.ethereum?.on) {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        updateAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      updateNetwork(chainId);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, disconnect, updateAccount, updateNetwork]); // ✅ Dependencias estables

  /**
   * CONECTAR - FLUJO PRINCIPAL - ✅ DEPENDENCIAS ESTABLES
   */
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setNetworkError('No se detectó un wallet Ethereum. Por favor instala MetaMask o otro wallet compatible.');
      return;
    }

    setLoading(true);
    setNetworkError(null);

    try {
      const alreadyConnected = await checkIfAlreadyConnected();
      
      if (alreadyConnected) {
        setLoading(false);
        return;
      }

      const connectionSuccess = await requestConnection();
      
      if (!connectionSuccess) {
        throw new Error('No se pudo establecer la conexión con el wallet');
      }

      setupEventListeners();

    } catch (error: any) {
      console.error('Error en flujo de conexión:', error);
      setNetworkError(error.message || 'Error desconocido al conectar con el wallet');
    } finally {
      setLoading(false);
    }
  }, [isMetaMaskInstalled, checkIfAlreadyConnected, requestConnection, setupEventListeners]); // ✅ Dependencias estables

  /**
   * EFECTO INICIAL - ✅ DEPENDENCIAS ESTABLES Y CORRECTAS
   */
  useEffect(() => {
    const initialize = async () => {
      const installed = checkMetaMaskInstalled();
      setIsMetaMaskInstalled(installed);

      if (installed) {
        await checkIfAlreadyConnected();
        setupEventListeners();
      } else {
        setNetworkError('No se detectó un wallet Ethereum. Instala MetaMask o otro wallet compatible.');
      }
    };

    initialize();
  }, [checkMetaMaskInstalled, checkIfAlreadyConnected, setupEventListeners]); // ✅ Dependencias estables

  return {
    account,
    network,
    connected,
    loading,
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