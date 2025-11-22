'use client';

import { useState, useEffect } from 'react';
import { createWalletClient, custom, type Address } from 'viem';
import { getCurrentChain } from '@/app/viem-config';

interface WalletInfo {
  address: Address;
  chainId: string;
  networkName: string;
}

export default function ConnectWallet() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Effect para detectar cambios en la cuenta
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Cuenta desconectada
        setWalletInfo(null);
      } else {
        // Cuenta conectada, actualizar información
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      // Cadena cambiada, reconectar
n      connectWallet();
    };

    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }
      
      // Crear wallet client usando MetaMask
      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
        chain: getCurrentChain()
      });
      
      // Solicitar conexión
      const accounts = await walletClient.requestAddresses();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please ensure your wallet is unlocked.');
      }
      
      // Obtener información de la cadena
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      
      // Verificar que estamos en la cadena correcta
      if (chainId !== getCurrentChain().id) {
        try {
          // Intentar cambiar a la cadena correcta
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${getCurrentChain().id.toString(16)}` }]
          });
        } catch (switchError) {
          // Si la cadena no está agregada, intentar agregarla
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${getCurrentChain().id.toString(16)}`,
                chainName: getCurrentChain().name,
                nativeCurrency: getCurrentChain().nativeCurrency,
                rpcUrls: [getCurrentChain().rpcUrls.default.http[0]],
                blockExplorerUrls: [getCurrentChain().blockExplorers?.default?.url]
              }]
            });
          } catch (addError) {
            throw new Error(`Failed to switch to required network. Please manually switch to ${getCurrentChain().name} in MetaMask.`);
          }
        }
      }
      
      setWalletInfo({
        address: accounts[0],
        chainId: chainIdHex,
        networkName: getCurrentChain().name
      });
      
      // Escuchar cambios en la cuenta
      window.ethereum.on('accountsChanged', () => {
        setWalletInfo(null);
        connectWallet();
      });
      
      // Escuchar cambios en la cadena
      window.ethereum.on('chainChanged', () => {
        connectWallet();
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletInfo(null);
    setShowDetails(false);
    setError(null);
  };
  
  const formatAddress = (address: Address): string => {
    if (!address) return '0x...';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Opcional: mostrar feedback de copiado
    });
  };

  return (
    <div className="flex justify-center my-4">
      <div className="w-full max-w-md">
        {!walletInfo ? (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                     text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl 
                     transition-all duration-200 transform hover:scale-105 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {isConnecting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting to MetaMask...</span>
              </div>
            ) : (
              <span>Connect Wallet</span>
            )}
          </button>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Connected</span>
              </div>
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                {showDetails ? '▼' : '▶'}
              </button>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-full">
                  {formatAddress(walletInfo.address)}
                </div>
                <button
                  onClick={() => copyToClipboard(walletInfo.address)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Copy address"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </button>
              </div>
              <button
                onClick={disconnectWallet}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Disconnect
              </button>
            </div>
            
            {showDetails && (
              <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Network:</span>
                  <span className="font-medium">{walletInfo.networkName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="