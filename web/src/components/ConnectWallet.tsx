"use client";

import { useEffect } from 'react';

/**
 * Componente para conectar y desconectar la billetera del usuario
 * Diseño responsive con Tailwind CSS
 */
export default function ConnectWallet({
  connected = false,
  onConnect = () => {},
  onDisconnect = () => {}
}: {
  connected?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  const account = connected ? "0x1234567890123456789012345678901234567890" : null;

  // No necesitamos verificar la conexión aquí ya que el estado viene desde el componente padre



  /**
   * Maneja el clic para conectar la billetera
   */
  const handleConnect = async () => {
    if (typeof window === 'undefined') return;
    
    if (!(window as any).ethereum) {
      alert('MetaMask is not installed. Please install it to use this app.');
      return;
    }
    
    try {
      // Conectar con MetaMask
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      
      // Notificar al componente padre que se ha conectado
      onConnect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  /**
   * Maneja el clic para desconectar la billetera
   */
  const handleDisconnect = () => {
    onDisconnect();
  };

  /**
   * Formatea la dirección de la billetera para mostrar (ej: 0x123...abc)
   */
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex justify-center my-4">
      <div className="w-full max-w-md">
        {!connected ? (
          <button
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                     text-white font-bold py-3 px-6 rounded-xl shadow-lg
                     transform transition-all duration-200 hover:scale-105
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center"
          >
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Connect Wallet
              </>
          </button>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <span className="font-mono text-sm text-gray-700" title={account || ''}>
                  {account ? formatAddress(account) : ''}
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="text-red-500 hover:text-red-700 text-sm font-semibold
                         transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}