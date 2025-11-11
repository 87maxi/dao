"use client";

import { render, screen, fireEvent } from '@testing-library/react';
import { Web3Provider } from '@/hooks/useWeb3';
import FundingPanel from '@/components/FundingPanel';

// Mock the useWeb3 hook
jest.mock('@/hooks/useWeb3', () => ({
  useWeb3: () => ({
    account: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    userBalance: '100.0',
    daoBalance: '1000.0',
    depositToDAO: jest.fn(),
    isLoading: false
  })
}));

describe('FundingPanel', () => {
  const depositToDAOMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the useWeb3 hook with the mock function
    require('@/hooks/useWeb3').useWeb3.mockReturnValue({
      account: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      userBalance: '100.0',
      daoBalance: '1000.0',
      depositToDAO: depositToDAOMock,
      isLoading: false
    });
  });

  it('displays user and DAO balances', () => {
    render(
      <Web3Provider>
        <FundingPanel />
      </Web3Provider>
    );
    
    expect(screen.getByText('Your Balance in DAO')).toBeInTheDocument();
    expect(screen.getByText('100.0 ETH')).toBeInTheDocument();
    
    expect(screen.getByText('Total DAO Balance')).toBeInTheDocument();
    expect(screen.getByText('1000.0 ETH')).toBeInTheDocument();
  });

  it('calls depositToDAO with correct amount when deposit button is clicked', async () => {
    render(
      <Web3Provider>
        <FundingPanel />
      </Web3Provider>
    );
    
    // Find and fill the deposit amount input
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '10.5' } });
    
    // Click the deposit button
    fireEvent.click(screen.getByText('Deposit'));
    
    expect(depositToDAOMock).toHaveBeenCalledWith('10.5');
  });

  it('disables deposit button when amount is empty', () => {
    render(
      <Web3Provider>
        <FundingPanel />
      </Web3Provider>
    );
    
    const amountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(amountInput, { target: { value: '' } });
    
    const depositButton = screen.getByText('Deposit');
    expect(depositButton).toBeDisabled();
  });
});