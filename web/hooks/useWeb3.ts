"use client";

import { useState, createContext, useContext, useEffect, ReactNode } from 'react';

// Types
interface Proposal {
  id: string;
  beneficiary: string;
  amount: string;
  deadline: number;
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
  executed: boolean;
}

interface Web3ContextType {
  account: string | null;
  balance: string | null;
  userBalance: string | null;
  daoBalance: string | null;
  proposals: Proposal[];
  userVotes: Record<string, number>;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  depositToDAO: (amount: string) => Promise<void>;
  createProposal: (beneficiary: string, amount: string, duration: number) => Promise<void>;
  voteOnProposal: (proposalId: string, vote: number) => Promise<void>;
  loadProposals: () => Promise<void>;
}

// Create Context
const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Mock Data for Development
const MOCK_ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const MOCK_BALANCE = "1000.0";

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string | null>(null);
  const [daoBalance, setDaoBalance] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Mock connection to MetaMask
  const connectWallet = async () => {
    try {
      // Simulate wallet connection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAccount(MOCK_ACCOUNT);
      setBalance(MOCK_BALANCE);
      setUserBalance((parseFloat(MOCK_BALANCE) * 0.5).toString());
      setDaoBalance((parseFloat(MOCK_BALANCE) * 2).toString());
      
      // Load proposals on connect
      await loadProposals();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance(null);
    setUserBalance(null);
    setDaoBalance(null);
    setProposals([]);
    setUserVotes({});
  };

  const depositToDAO = async (amount: string) => {
    if (!account) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update balances
      const newAmount = parseFloat(amount);
      const currentBalance = parseFloat(userBalance || '0');
      const currentDaoBalance = parseFloat(daoBalance || '0');
      
      setUserBalance((currentBalance - newAmount).toFixed(4));
      setDaoBalance((currentDaoBalance + newAmount).toFixed(4));
    } catch (error) {
      console.error('Deposit failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createProposal = async (beneficiary: string, amount: string, duration: number) => {
    if (!account) throw new Error('Wallet not connected');
    if (!beneficiary || !amount || !duration) {
      throw new Error('All fields are required');
    }

    setIsLoading(true);
    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newProposal: Proposal = {
        id: (proposals.length + 1).toString(),
        beneficiary,
        amount,
        deadline: Math.floor(Date.now() / 1000) + duration,
        votes: {
          yes: 0,
          no: 0,
          abstain: 0
        },
        executed: false
      };
      
      setProposals(prev => [...prev, newProposal]);
    } catch (error) {
      console.error('Failed to create proposal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const voteOnProposal = async (proposalId: string, vote: number) => {
    if (!account) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      // Simulate gasless voting with relayer
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update proposal votes
      setProposals(prev => prev.map(prop => {
        if (prop.id === proposalId) {
          const updatedVotes = { ...prop.votes };
          if (vote === 1) updatedVotes.yes++;
          else if (vote === 2) updatedVotes.no++;
          else if (vote === 3) updatedVotes.abstain++;
          
          return { ...prop, votes: updatedVotes };
        }
        return prop;
      }));
      
      // Record user vote
      setUserVotes(prev => ({ ...prev, [proposalId]: vote }));
      
    } catch (error) {
      console.error('Voting failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadProposals = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockProposals: Proposal[] = [
        {
          id: '1',
          beneficiary: '0x742d35Cc6634C0532925a3b8D4C0cD3583aeb6A1',
          amount: '50.0',
          deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours
          votes: { yes: 3, no: 1, abstain: 1 },
          executed: false
        },
        {
          id: '2',
          beneficiary: '0x26154E893178a2B8cD137fCf4Cc74F9F19a8B8a1',
          amount: '100.0',
          deadline: Math.floor(Date.now() / 1000) + 172800, // 48 hours
          votes: { yes: 5, no: 2, abstain: 0 },
          executed: false
        }
      ];
      
      setProposals(mockProposals);
      
      // Mock user votes
      const mockUserVotes: Record<string, number> = {};
      mockProposals.forEach(prop => {
        if (parseInt(prop.id) % 2 === 0) {
          mockUserVotes[prop.id] = 1; // User voted yes on even proposals
        }
      });
      setUserVotes(mockUserVotes);
      
    } catch (error) {
      console.error('Failed to load proposals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate account change (like switching networks)
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        disconnectWallet();
      } else if (account && accounts[0] !== account) {
        // Account changed
