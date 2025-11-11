"use client";

import { renderHook, act } from '@testing-library/react';
import { Web3Provider, useWeb3 } from '@/hooks/useWeb3';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useWeb3', () => {
  it('provides default values initially', () => {
    const { result } = renderHook(() => useWeb3(), {
      wrapper: Web3Provider
    });
    
    expect(result.current.account).toBeNull();
    expect(result.current.balance).toBeNull();
    expect(result.current.userBalance).toBeNull();
    expect(result.current.daoBalance).toBeNull();
    expect(result.current.proposals).toEqual([]);
    expect(result.current.userVotes).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it('connects wallet successfully', async () => {
    const { result } = renderHook(() => useWeb3(), {
      wrapper: Web3Provider
    });
    
    await act(async () => {
      await result.current.connectWallet();
    });
    
    expect(result.current.account).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    expect(result.current.balance).toBe('1000.0');
    expect(result.current.userBalance).toBe('500.0');
    expect(result.current.daoBalance).toBe('2000.0');
  });

  it('disconnects wallet successfully', async () => {
    const { result } = renderHook(() => useWeb3(), {
      wrapper: Web3Provider
    });
    
    // First connect
    await act(async () => {
      await result.current.connectWallet();
    });
    
    // Then disconnect
    await act(async () => {
      result.current.disconnectWallet();
    });
    
    expect(result.current.account).toBeNull();
    expect(result.current.balance).toBeNull();
    expect(result.current.userBalance).toBeNull();
    expect(result.current.daoBalance).toBeNull();
    expect(result.current.proposals).toEqual([]);
    expect(result.current.userVotes).toEqual({});
  });

  it('deposits funds to DAO', async () => {
    const { result } = renderHook(() => useWeb3(), {
      wrapper: Web3Provider
    });
    
    // Connect first
    await act(async () => {
      await result.current.connectWallet();
    });
    
    const initialUserBalance = parseFloat(result.current.userBalance || '0');
    const initialDaoBalance = parseFloat(result.current.daoBalance || '0');
    
    // Deposit 10 ETH
    await act(async () => {
      await result.current.depositToDAO('10');
    });
    
    expect(parseFloat(result.current.userBalance || '0')).toBe(initialUserBalance - 10);
    expect(parseFloat(result.current.daoBalance || '0')).toBe(initialDaoBalance + 10);
  });

  it('creates a proposal', async () => {
    const { result } = renderHook(() => useWeb3(), {
      wrapper: Web3Provider
    });
    
    // Connect first
    await act(async () => {
      await result.current.connectWallet();
    });
    
    const initialProposalCount = result.current.proposals.length;
    
    // Create proposal
    await act(async () => {
      await result.current.createProposal(
        '0x742d35Cc6634C0532925a3b8D4C0cD3583aeb6A1', 
        '50.0', 
        86400
      );
    });
    
    expect(result.current.proposals.length).toBe(initialProposalCount + 1);
    expect(result.current.proposals[initialProposalCount].beneficiary).toBe('0x742d35Cc6634C0532925a3b8D4C0cD3583aeb6A1');
    expect(result.current.proposals[initialProposalCount].amount).toBe('50.0');
  });
});