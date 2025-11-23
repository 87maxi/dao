"use client";

import { useState, useEffect } from "react";
import { createWalletClient, custom, formatEther } from 'viem';
import { mainnet } from 'viem/chains';

// Extender la interfaz Window para incluir ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceSymbol, setBalanceSymbol] = useState<string>('ETH');
  
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('MetaMask no está instalado');
      return;
    }

    setStatus('connecting');
    
    try {
      const walletClient = createWalletClient({
        chain: mainnet,
        transport: custom(window.ethereum)
      });

      const [address] = await walletClient.requestAddresses();
      setAddress(address);
      setIsConnected(true);
      setStatus('connected');

      // Obtener balance directamente usando window.ethereum
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      const balanceWei = BigInt(balanceHex);
      setBalance(formatEther(balanceWei));
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setStatus('disconnected');
      setIsConnected(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setStatus('disconnected');
    setBalance(null);
  };

  // Efecto para verificar conexión existente al cargar el componente
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            setStatus('connected');
            
            // Obtener balance directamente usando window.ethereum
            const balanceHex = await window.ethereum.request({
              method: 'eth_getBalance',
              params: [accounts[0], 'latest']
            });
            
            const balanceWei = BigInt(balanceHex);
            setBalance(formatEther(balanceWei));
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={connectWallet}
          disabled={status === 'connecting'}
          className="btn btn-primary"
        >
          {status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-800/70 px-4 py-2 rounded-xl border border-purple-500/30 backdrop-blur-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <div className="flex flex-col">
        <span className="text-sm font-mono text-white">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <span className="text-xs text-purple-300">
          {balance ? parseFloat(balance).toFixed(4) : '0.00'} {balanceSymbol}
        </span>
      </div>
      <button
        onClick={disconnectWallet}
        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
        title="Disconnect wallet"
      >
        Disconnect
      </button>
    </div>
  );
}