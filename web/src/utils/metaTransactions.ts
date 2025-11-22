import { type PublicClient, type WalletClient, parseEther, encodeFunctionData } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Env } from '@/utils/config';
import MinimalForwarder from '@/contracts/abis/MinimalForwarder.json';

export interface ForwardRequest {
  from: string;
  to: string;
  value: string;
  gas: string;
  nonce: number;
  deadline: number;
  data: string;
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

class MetaTransactionService {
  private domain: EIP712Domain;

  constructor() {
    this.domain = {
      name: 'MinimalForwarder',
      version: '1',
      chainId: Env.CHAIN_ID,
      verifyingContract: Env.FORWARDER_CONTRACT_ADDRESS
    };
  }

  /**
   * Gets the current nonce for an address from the forwarder contract
   */
  async getNonce(address: string): Promise<number> {
    try {
      const publicClient = usePublicClient();
      if (!publicClient) {
        throw new Error('No public client available');
      }

      const result = await publicClient.readContract({
        address: Env.FORWARDER_CONTRACT_ADDRESS,
        abi: MinimalForwarder,
        functionName: 'getNonce',
        args: [address]
      });
      
      return Number(result);
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw new Error('Failed to get nonce from forwarder contract');
    }
  }

  /**
   * Creates a forward request for a meta-transaction
   */
  createForwardRequest(
    from: string,
    to: string,
    data: string,
    gasLimit: number = 500000,
    deadlineMinutes: number = 30
  ): ForwardRequest {
    const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);
    
    return {
      from,
      to,
      value: '0',
      gas: gasLimit.toString(),
      nonce: 0, // This will be populated with the actual nonce
      deadline,
      data
    };
  }

  /**
   * Signs a forward request using EIP-712
   */
  async signForwardRequest(
    request: ForwardRequest,
    walletClient: WalletClient
  ): Promise<string> {
    try {
      // Get the actual nonce
      const nonce = await this.getNonce(request.from);
      const requestWithNonce = { ...request, nonce };

      // Sign the typed data
      const signature = await walletClient.signTypedData({
        domain: this.domain,
        types: {
          ForwardRequest: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'gas', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'data', type: 'bytes' }
          ]
        },
        primaryType: 'ForwardRequest',
        message: requestWithNonce
      });

      return signature;
    } catch (error) {
      console.error('Error signing forward request:', error);
      throw new Error('Failed to sign meta-transaction');
    }
  }

  /**
   * Executes a meta-transaction by sending it to the forwarder
   */
  async executeMetaTransaction(
    request: ForwardRequest,
    signature: string,
    walletClient: WalletClient
  ): Promise<unknown> {
    try {
      // Execute the meta-transaction
      const hash = await walletClient.writeContract({
        address: Env.FORWARDER_CONTRACT_ADDRESS,
        abi: MinimalForwarder.abi,
        functionName: 'execute',
        args: [request, signature],
        gas: BigInt(request.gas)
      });

      // We can't wait for receipt here as we don't have access to publicClient
      // This will be handled by the caller
      return hash;
    } catch (error) {
      console.error('Error executing meta-transaction:', error);
      throw new Error('Failed to execute meta-transaction');
    }
  }

  /**
   * Verifies a forward request signature
   */
  async verifyForwardRequest(
    request: ForwardRequest,
    signature: string
  ): Promise<boolean> {
    try {
      const publicClient = usePublicClient();
      if (!publicClient) {
        throw new Error('No public client available');
      }

      const result = await publicClient.readContract({
        address: Env.FORWARDER_CONTRACT_ADDRESS,
        abi: MinimalForwarder.abi,
        functionName: 'verify',
        args: [request, signature]
      });
      
      return Boolean(result);
    } catch (error) {
      console.error('Error verifying forward request:', error);
      return false;
    }
  }

  /**
   * Helper to create and send a meta-transaction for DAO voting
   */
  async createDAOVoteMetaTransaction(
    from: string,
    proposalId: number,
    voteType: number
  ): Promise<unknown> {
    try {
      // Create the vote data
      const daoAbi = [
        'function castVoteByMetaTx(address from, uint256 proposalId, uint8 voteType, uint256 deadline, bytes calldata signature)'
      ];

      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
      
      // Encode the function data for the target contract
      const data = encodeFunctionData({
        abi: daoAbi,
        functionName: 'castVoteByMetaTx',
        args: [
          from,
          proposalId,
          voteType,
          deadline,
          '0x' // Signature will be added by the forwarder
        ]
      });

      // Create forward request
      const request = this.createForwardRequest(
        from,
        Env.DAO_VOTING_ADDRESS,
        data,
        500000,
        30
      );

      // Get wallet client
      const { data: walletClient } = useWalletClient();
      if (!walletClient) {
        throw new Error('Wallet client not available');
      }

      // Sign the request
      const signature = await this.signForwardRequest(request, walletClient);

      // Execute the meta-transaction
      return await this.executeMetaTransaction(request, signature, walletClient);
    } catch (error) {
      console.error('Error creating DAO vote meta-transaction:', error);
      throw new Error('Failed to create vote meta-transaction');
    }
  }
}

export const metaTransactionService = new MetaTransactionService();

export default MetaTransactionService;