'use client';

import { useState, useEffect, useCallback } from 'react';
import { createWalletClient, custom, type Address } from 'viem';
import { getCurrentChain } from '@/app/viem-config';

interface Network {
  name: string;
  chainId: number;
}

interface UseViemReturns {
  wallet: {
    address: Address | null;
    chainId: string | null;
    isConnected: boolean;
  };
  connect: () => Promise<void>;
  disconnect: () => void;
  isNetworkAllowed: (chainId: number) => boolean;
  isLoading: boolean;
  error: string | null;
}

const ANVIL_CONFIG = {
  CHAIN_ID: getCurrentChain().id,
  CHAIN_NAME: getCurrentChain().name,
};

const ALLOWED_CHAIN_IDS = [ANVIL_CONFIG.CHAIN_ID];

/**
 * Custom hook for viem integration
 * Handles wallet connection, disconnection, and network validation
 */
export default function useViem(): UseViemReturns {
  const [wallet, setWallet] = useState<UseViemReturns['wallet']>({
    address: null,
    chainId: null,
    isConnected: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNetworkAllowed = useCallback((chainId: number): boolean => {
    return ALLOWED_CHAIN_IDS.includes(chainId);
  }, []);

  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }
      
      // Create wallet client using MetaMask
      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
        chain: getCurrentChain()
      });
      
      // Request connection
      const accounts = await walletClient.requestAddresses();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please ensure your wallet is unlocked.');
      }
      
      // Get chain information
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      
      // Verify we're on the correct chain
      if (chainId !== ANVIL_CONFIG.CHAIN_ID) {
        try {
          // Try to switch to the correct chain
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${ANVIL_CONFIG.CHAIN_ID.toString(16)}` }]
          });
        } catch (switchError: any) {
          // If the chain is not added, try to add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${ANVIL_CONFIG.CHAIN_ID.toString(16)}`,
                  chainName: ANVIL_CONFIG.CHAIN_NAME,
                  nativeCurrency: getCurrentChain().nativeCurrency,
                  rpcUrls: [getCurrentChain().rpcUrls.default.http[0]],
                  blockExplorerUrls: getCurrentChain().blockExplorers ? [getCurrentChain().blockExplorers.default.url] : undefined
                }]
              });
            } catch (addError) {
              throw new Error(`Failed to add required network. Please manually add ${ANVIL_CONFIG.CHAIN_NAME} in MetaMask.`);
            }
          } else {
            throw new Error(`Failed to switch to required network. Please manually switch to ${ANVIL_CONFIG.CHAIN_NAME} in MetaMask.`);
          }
        }
      }
      
      // Update wallet state
      setWallet({
        address: accounts[0],
        chainId: chainIdHex,
        isConnected: true
      });
      
      // Set up listeners for account and chain changes
      const handleAccountsChanged = (updatedAccounts: string[]) => {
        if (updatedAccounts.length === 0) {
          // Account disconnected
n          setWallet({
            address: null,
            chainId: null,
            isConnected: false
          });
        } else {
          // Account changed
          setWallet(prev => ({
            ...prev,
            address: updatedAccounts[0]
          }));
        }
      };
      
      const handleChainChanged = (newChainId: string) => {
        setWallet(prev => ({
          ...prev,
          chainId: newChainId
        }));
      };
      
      // Remove existing listeners first to avoid duplicates
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
      
      // Add listeners
      if (window.ethereum.on) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Connection error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Remove listeners
    if (window.ethereum && window.ethereum.removeListener) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setWallet({
            address: null,
            chainId: null,
            isConnected: false
          });
        }
      };
      
      const handleChainChanged = (chainId: string) => {
        setWallet(prev => ({
          ...prev,
          chainId
        }));
      };
      
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      
      // Don't call disconnect on walletClient as it doesn't have a disconnect method
    }
    
    // Reset state
    setWallet({
      address: null,
      chainId: null,
      isConnected: false
    });
    setError(null);
  }, []);

  // Effect to connect on mount if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (accounts.length > 0) {
          setWallet({
            address: accounts[0],
            chainId,
            isConnected: true
          });
          
          // Set up listeners
          const handleAccountsChanged = (updatedAccounts: string[]) => {
            if (updatedAccounts.length === 0) {
              setWallet({
                address: null,
                chainId: null,
                isConnected: false
              });
            } else {
              setWallet(prev => ({
                ...prev,
                address: updatedAccounts[0]
              }));
            }
          };
          
          const handleChainChanged = (newChainId: string) => {
            setWallet(prev => ({
              ...prev,
              chainId: newChainId
            }));
          };
          
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    };
    
    checkConnection();
    
    // Cleanup
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length === 0) {
            setWallet({
              address: null,
              chainId: null,
              isConnected: false
            });
          }
        };
        
        const handleChainChanged = (chainId: string) => {
          setWallet(prev => ({
            ...prev,
            chainId
          }));
        };
        
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.eth