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
  networkError: string | null;
  isMetaMaskInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  getProvider: () => ethers.BrowserProvider | null;
  getSigner: () => Promise<ethers.Signer | null>;
  switchToAnvil: () => Promise<void>;
  isNetworkAllowed: (chainId: number) => boolean;
}

// Configuración para Anvil y redes locales
const ANVIL_CONFIG = {
  CHAIN_ID: 31337,
  CHAIN_NAME: 'Anvil Local Network',
  RPC_URL: 'http://127.0.0.1:8545',
  CURRENCY: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  BLOCK_EXPLORER: ''
};

const ALLOWED_NETWORKS = {
  31337: 'Anvil Local Network',
  1337: 'Ganache Local Network'
};

const ALLOWED_CHAIN_IDS = [31337, 1337];


// Tipo para Ethereum Provider
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
 * Solo permite conexión con Anvil y redes locales
 */
export default function useWeb3(): UseWeb3Returns {
  const [account, setAccount] = useState<Account | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  // Objeto provider para reutilizar
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  /**
   * VERIFICACIÓN COMPATIBLE DE WALLET
   */
  const checkMetaMaskInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    // Verificar si window.ethereum existe y tiene el método request
    const hasEthereum = !!window.ethereum && typeof window.ethereum.request === 'function';
    
    console.log('🔍 Verificando wallet Ethereum:', {
      tieneEthereum: !!window.ethereum,
      tieneRequest: !!window.ethereum?.request,
      tieneOn: !!window.ethereum?.on,
      isMetaMask: window.ethereum?.isMetaMask
    });

    return hasEthereum;
  }, []);

  /**
   * VERIFICAR SI YA ESTÁ CONECTADO
   */
  const checkIfAlreadyConnected = useCallback(async (): Promise<boolean> => {
    if (!isMetaMaskInstalled) return false;

    try {
      console.log('🔍 Verificando conexión existente...');
      const accounts = await window.ethereum!.request({ 
        method: 'eth_accounts' 
      });

      console.log('📋 Cuentas obtenidas:', accounts);

      if (accounts && accounts.length > 0) {
        const currentAccount = accounts[0];
        
        // Obtener información de la red
        const chainId = await window.ethereum!.request({
          method: 'eth_chainId'
        });
        const chainIdNumber = parseInt(chainId, 16);

        console.log('✅ Usuario ya conectado:', {
          cuenta: currentAccount,
          chainId: chainId,
          chainIdNumber: chainIdNumber
        });

        // Actualizar estados
        await updateAccount(currentAccount);
        await updateNetwork(chainIdNumber);
        setConnected(true);
        
        return true;
      }
      
      console.log('ℹ️ Usuario no está conectado');
      return false;
    } catch (error) {
      console.error('❌ Error verificando conexión existente:', error);
      return false;
    }
  }, [isMetaMaskInstalled]);

  /**
   * SOLICITAR CONEXIÓN
   */
  const requestConnection = useCallback(async (): Promise<boolean> => {
    if (!isMetaMaskInstalled) return false;

    try {
      console.log('🔄 Solicitando conexión al wallet...');
      
      const accounts = await window.ethereum!.request({ 
        method: 'eth_requestAccounts' 
      });

      console.log('📋 Cuentas después de conectar:', accounts);

      if (accounts && accounts.length > 0) {
        const currentAccount = accounts[0];
        
        // Obtener información de la red
        const chainId = await window.ethereum!.request({
          method: 'eth_chainId'
        });
        const chainIdNumber = parseInt(chainId, 16);

        console.log('✅ Conexión exitosa:', {
          cuenta: currentAccount,
          chainId: chainId,
          chainIdNumber: chainIdNumber
        });

        // Actualizar estados
        await updateAccount(currentAccount);
        await updateNetwork(chainIdNumber);
        setConnected(true);
        
        return true;
      }
      
      console.log('❌ No se obtuvieron cuentas');
      return false;
    } catch (error: any) {
      console.error('❌ Error solicitando conexión:', error);
      
      if (error.code === 4001) {
        throw new Error('El usuario rechazó la conexión con el wallet');
      } else if (error.code === -32002) {
        throw new Error('Ya hay una solicitud de conexión pendiente');
      } else {
        throw new Error('Error al conectar con el wallet: ' + (error.message || 'Error desconocido'));
      }
    }
  }, [isMetaMaskInstalled]);

  // Verificar si una red está permitida
  const isNetworkAllowed = useCallback((chainId: number): boolean => {
    return ALLOWED_CHAIN_IDS.includes(chainId);
  }, []);

  // Obtener provider
  const getProvider = useCallback((): ethers.BrowserProvider | null => {
    if (!isMetaMaskInstalled) return null;

    if (!provider) {
      const newProvider = new ethers.BrowserProvider(window.ethereum!);
      setProvider(newProvider);
      return newProvider;
    }
    return provider;
  }, [provider, isMetaMaskInstalled]);

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
    return ALLOWED_NETWORKS[chainId as keyof typeof ALLOWED_NETWORKS] || `Red Desconocida (${chainId})`;
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
      console.error('Error obteniendo balance:', error);
      setAccount({
        address,
        balance: '0.0000'
      });
    }
  }, [getProvider]);

  // Actualizar estado de red
  const updateNetwork = useCallback(async (chainId: number) => {
    const networkName = getNetworkName(chainId);
    setNetwork({
      name: networkName,
      chainId
    });

    // Verificar si la red está permitida
    if (!isNetworkAllowed(chainId)) {
      setNetworkError(`Red no permitida: ${networkName}. Solo se permiten redes locales (Anvil: 31337, Ganache: 1337)`);
    } else {
      setNetworkError(null);
    }
  }, [isNetworkAllowed]);

  /**
   * CAMBIAR A LA RED DE ANVIL
   */
  const switchToAnvil = useCallback(async (): Promise<boolean> => {
    if (!isMetaMaskInstalled) {
      console.log('❌ No se puede cambiar red: Wallet no instalado');
      return false;
    }

    try {
      console.log('🔄 Cambiando a red Anvil...');
      
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${ANVIL_CONFIG.CHAIN_ID.toString(16)}` }],
      });
      
      console.log('✅ Cambio exitoso a red Anvil');
      return true;
    } catch (error: any) {
      console.error('❌ Error cambiando a red Anvil:', error);
      
      // Si la red no existe en el wallet, intentar agregarla
      if (error.code === 4902) {
        console.log('🔄 La red Anvil no existe, agregándola...');
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${ANVIL_CONFIG.CHAIN_ID.toString(16)}`,
              chainName: ANVIL_CONFIG.CHAIN_ID,
              rpcUrls: [ANVIL_CONFIG.RPC_URL],
              nativeCurrency: ANVIL_CONFIG.CURRENCY,
              blockExplorerUrls: ANVIL_CONFIG.BLOCK_EXPLORER ? [ANVIL_CONFIG.BLOCK_EXPLORER] : []
            }],
          });
          
          console.log('✅ Red Anvil agregada exitosamente');
          return true;
        } catch (addError) {
          console.error('❌ Error agregando red Anvil:', addError);
          return false;
        }
      }
      
      return false;
    }
  }, [isMetaMaskInstalled]);

  // Desconectar
  const disconnect = useCallback(() => {
    console.log('🔴 Desconectando wallet...');
    setAccount(null);
    setNetwork(null);
    setConnected(false);
    setProvider(null);
    setNetworkError(null);
  }, []);

  /**
   * CONFIGURAR LISTENERS DE EVENTOS - VERSIÓN COMPATIBLE
   */
  const setupEventListeners = useCallback(() => {
    if (!isMetaMaskInstalled) {
      console.log('❌ No se pueden configurar listeners: Wallet no instalado');
      return;
    }

    // Verificar si el proveedor soporta eventos
    if (!window.ethereum?.on) {
      console.log('⚠️ Proveedor no soporta eventos, usando polling...');
      // En este caso, podríamos implementar polling como fallback
      return;
    }

    console.log('🔧 Configurando listeners de eventos...');

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('🔄 Evento: Cuentas cambiadas:', accounts);
      if (accounts.length === 0) {
        disconnect();
      } else {
        updateAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      console.log('🔄 Evento: Red cambiada:', chainIdHex);
      const chainId = parseInt(chainIdHex, 16);
      updateNetwork(chainId);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    console.log('✅ Listeners configurados correctamente');

    // Cleanup
    return () => {
      console.log('🧹 Limpiando listeners...');
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, disconnect, updateAccount, updateNetwork]);

  /**
   * CONECTAR - FLUJO PRINCIPAL
   */
  const connect = useCallback(async () => {
    console.log('🚀 Iniciando flujo de conexión...');

    if (!isMetaMaskInstalled) {
      const errorMsg = 'No se detectó un wallet Ethereum. Por favor instala MetaMask o otro wallet compatible.';
      console.error('❌', errorMsg);
      setNetworkError(errorMsg);
      return;
    }

    setLoading(true);
    setNetworkError(null);

    try {
      // Paso 1: Verificar si ya está conectado
      console.log('🔍 Verificando si ya está conectado...');
      const alreadyConnected = await checkIfAlreadyConnected();
      
      if (alreadyConnected) {
        console.log('✅ Usuario ya estaba conectado');
        setLoading(false);
        return;
      }

      // Paso 2: Si no está conectado, solicitar conexión
      console.log('📨 Usuario no conectado, solicitando conexión...');
      const connectionSuccess = await requestConnection();
      
      if (!connectionSuccess) {
        throw new Error('No se pudo establecer la conexión con el wallet');
      }

      // Paso 3: Configurar listeners después de conectar
      console.log('🔧 Configurando listeners post-conexión...');
      setupEventListeners();

      console.log('🎉 Flujo de conexión completado exitosamente');

    } catch (error: any) {
      console.error('❌ Error en flujo de conexión:', error);
      setNetworkError(error.message || 'Error desconocido al conectar con el wallet');
    } finally {
      setLoading(false);
    }
  }, [isMetaMaskInstalled, checkIfAlreadyConnected, requestConnection, setupEventListeners]);

  // Efecto inicial: Verificar wallet y conexión existente
  useEffect(() => {
    const initialize = async () => {
      console.log('🔦 Inicializando hook useWeb3...');
      
      // Verificar si hay un wallet disponible
      const installed = checkMetaMaskInstalled();
      setIsMetaMaskInstalled(installed);

      if (installed) {
        console.log('✅ Wallet Ethereum detectado, verificando conexión...');
        
        // Verificar si ya está conectado
        await checkIfAlreadyConnected();
        
        // Configurar listeners (si son compatibles)
        setupEventListeners();
      } else {
        console.log('❌ No se detectó wallet Ethereum');
        setNetworkError('No se detectó un wallet Ethereum. Instala MetaMask o otro wallet compatible.');
      }
    };

    initialize();
  }, [checkMetaMaskInstalled, checkIfAlreadyConnected, setupEventListeners]);

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