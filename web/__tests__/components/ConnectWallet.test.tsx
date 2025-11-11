import { render, screen, fireEvent } from '@testing-library/react';
import { Web3Provider } from '@/hooks/useWeb3';
import ConnectWallet from '@/components/ConnectWallet';

// Mock the useWeb3 hook
jest.mock('@/hooks/useWeb3', () => ({
  useWeb3: jest.fn(),
  Web3Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('ConnectWallet', () => {
  const connectWalletMock = jest.fn();
  const disconnectWalletMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the useWeb3 hook with default disconnected state
    (require('@/hooks/useWeb3').useWeb3 as jest.Mock).mockReturnValue({
      account: null,
      balance: null,
      connectWallet: connectWalletMock,
      disconnectWallet: disconnectWalletMock
    });
  });

  it('renders connect button when not connected', () => {
    render(
      <Web3Provider>
        <ConnectWallet />
      </Web3Provider>
    );
    
    expect(screen.getByText('Connect MetaMask')).toBeInTheDocument();
  });

  it('calls connectWallet when button is clicked', () => {
    render(
      <Web3Provider>
        <ConnectWallet />
      </Web3Provider>
    );
    
    fireEvent.click(screen.getByText('Connect MetaMask'));
    expect(connectWalletMock).toHaveBeenCalled();
  });

  it('renders account info when connected', () => {
    // Mock connected state
    (require('@/hooks/useWeb3').useWeb3 as jest.Mock).mockReturnValue({
      account: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      balance: '10.0',
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn()
    });

    render(
      <Web3Provider>
        <ConnectWallet />
      </Web3Provider>
    );
    
    expect(screen.getByText(/Connected Address/i)).toBeInTheDocument();
    expect(screen.getByText('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')).toBeInTheDocument();
  });

  it('calls disconnectWallet when disconnect button is clicked', () => {
    // Mock connected state
    (require('@/hooks/useWeb3').useWeb3 as jest.Mock).mockReturnValue({
      account: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      balance: '10.0',
      connectWallet: jest.fn(),
      disconnectWallet: disconnectWalletMock
    });

    render(
      <Web3Provider>
        <ConnectWallet />
      </Web3Provider>
    );
    
    fireEvent.click(screen.getByText(/Disconnect/i));
    expect(disconnectWalletMock).toHaveBeenCalled();
  });
});