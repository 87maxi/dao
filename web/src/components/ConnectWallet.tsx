"use client";

import { useEffect, useState } from 'react';
import useWeb3 from '@/hooks/useWeb3'; // Ajusta la ruta según tu estructura
import { Env } from '@/utils/config'


interface WalletInfo {
  address: string;
  balance: string;
  chainId: string;
  network: string;
}

// Configuración para Anvil y redes locales
const ANVIL_CONFIG = {
  CHAIN_ID: Env.CHAIN_ID, // 31337 en hexadecimal
  CHAIN_NAME: 'Anvil Local Network',
  RPC_URL: Env.RPC_URL,
  CURRENCY_SYMBOL: 'ETH',
  BLOCK_EXPLORER: '',
  ACCOUNTS: [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
  ]
};




/**
 * Componente para conectar y desconectar la billetera del usuario
 * Solo permite conexión con Anvil y redes locales
 */
export default function ConnectWallet({
  connected = false,
  onConnect = () => {},
  onDisconnect = () => {}
}: {
  connected?: boolean;
  onConnect?: (walletInfo?: WalletInfo) => void;
  onDisconnect?: () => void;
}) {
  const {
    account,
    network,
    connected: isConnected,
    loading,
    networkError,
    isMetaMaskInstalled,
    connect,
    disconnect,
    switchToAnvil
  } = useWeb3();

  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  //const rpc = new BrowserRPCProvider(ANVIL_CONFIG.RPC_URL)
  // Sincronizar el estado de conexión con el hook
  useEffect(() => {
    
    
    if (isConnected && account && network) {
      const info: WalletInfo = {
        address: account.address,
        balance: account.balance,
        chainId: `0x${network.chainId.toString(16)}`,
        network: network.name
      };
      setWalletInfo(info);
      onConnect(info);
    } else if (!isConnected) {
      setWalletInfo(null);
      onDisconnect();
    }
  }, [isConnected, account, network, onConnect, onDisconnect]);

  // Manejar la conexión con switch a Anvil
  const handleConnect = async () => {
    try {
      // Primero cambiar a la red de Anvil
      const networkSwitched = await switchToAnvil();
      if (!networkSwitched) {
        console.error('No se pudo cambiar a la red de Anvil');
        return;
      }
      
      // Luego conectar
      await connect();
    } catch (error) {
      console.error('Error en conexión:', error);
    }
  };

  // Manejar desconexión
  const handleDisconnect = () => {
    disconnect();
    setShowWalletDetails(false);
    setWalletInfo(null);
  };

  /**
   * Formatea la dirección de la billetera para mostrar (ej: 0x123...abc)
   */
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Mostrar loading mientras verificamos
  if (loading) {
    return (
      <div className="flex justify-center my-4">
        <div className="w-full max-w-md">
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 font-bold py-3 px-6 rounded-xl
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center animate-pulse"
          >
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Verificando Wallet...</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Si MetaMask no está disponible
  if (!isMetaMaskInstalled) {
    return (
      <div className="flex justify-center my-4">
        <div className="w-full max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Wallet No Disponible
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    No se detectó un wallet Ethereum compatible. 
                    Por favor, instala MetaMask o otro wallet compatible para conectar tu billetera.
                  </p>
                </div>
                <div className="mt-4">
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    Instalar MetaMask
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center my-4">
      <div className="w-full max-w-md space-y-3">
        {/* Mensaje de error de red */}
        {networkError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-700 font-medium">{networkError}</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Solo se permiten redes locales: Anvil (0x7A69) o Ganache (0x539)
            </p>
          </div>
        )}

        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                     text-white font-bold py-4 px-6 rounded-xl shadow-lg
                     transform transition-all duration-200 hover:scale-105
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Conectando a Anvil...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <span>Conectar a Anvil</span>
              </>
            )}
          </button>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header de la wallet */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <span 
                      className="font-mono text-sm font-semibold text-gray-800" 
                      title={account?.address || ''}
                    >
                      {account ? formatAddress(account.address) : ''}
                    </span>
                    <div className="text-xs text-green-600 font-medium">
                      {network?.name || 'Conectado'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowWalletDetails(!showWalletDetails)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Detalles de la Wallet"
                  >
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${showWalletDetails ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Desconectar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Detalles expandibles de la wallet */}
            {showWalletDetails && walletInfo && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 animate-slideDown">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Red:</span>
                    <span className="text-sm font-mono text-gray-800">{walletInfo.network}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Balance:</span>
                    <span className="text-sm font-mono text-gray-800">{walletInfo.balance} ETH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Chain ID:</span>
                    <span className="text-sm font-mono text-gray-800">{walletInfo.chainId}</span>
                  </div>
                </div>
                
                {/* Información de cuentas de Anvil */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">Cuentas de Anvil Disponibles:</h4>
                  <div className="space-y-1">
                    {ANVIL_CONFIG.ACCOUNTS.map((anvilAccount, index) => (
                      <div key={anvilAccount} className="flex justify-between items-center text-xs">
                        <span className="font-mono text-gray-600">
                          {formatAddress(anvilAccount)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          account && anvilAccount.toLowerCase() === account.address.toLowerCase() 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {account && anvilAccount.toLowerCase() === account.address.toLowerCase() ? 'Actual' : `#${index}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones adicionales */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                  <button
                    onClick={() => window.open(`https://etherscan.io/address/${account?.address}`, '_blank')}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    <span>Ver en Explorer</span>
                  </button>
                  <button
                    onClick={() => account && navigator.clipboard.writeText(account.address)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    <span>Copiar Dirección</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información adicional para usuarios */}
        {!isConnected && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Solo se permiten conexiones a redes locales (Anvil/Ganache)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}