import { ethers } from 'ethers';
import { Env } from '@/utils/config';
import MinimalForwarder from '@/contracts/abis/MinimalForwarder.json';

export interface ForwardRequest {
  from: string;
  to: string;
  value: number;
  gas: number;
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
  private forwarderContract: ethers.Contract;
  private domain: EIP712Domain;

  constructor() {
    this.forwarderContract = new ethers.Contract(
      Env.FORWARDER_CONTRACT_ADDRESS,
      MinimalForwarder
    );
    
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
      const provider = new ethers.JsonRpcProvider(Env.RPC_URL);
      const nonce = await this.forwarderContract.connect(provider).getNonce(address);
      return Number(nonce);
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
      value: 0,
      gas: gasLimit,
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
    signer: ethers.Signer
  ): Promise<string> {
    try {
      // Get the actual nonce
      const nonce = await this.getNonce(request.from);
      const requestWithNonce = { ...request, nonce };

      // Sign the typed data
      const signature = await signer.signTypedData(
        this.domain,
        {
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
        requestWithNonce
      );

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
    provider: ethers.Provider
  ): Promise<ethers.TransactionResponse> {
    try {
      const forwarderWithSigner = this.forwarderContract.connect(provider.getSigner());
      
      const tx = await forwarderWithSigner.execute(request, signature, {
        gasLimit: request.gas
      });

      return tx;
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
      const provider = new ethers.JsonRpcProvider(Env.RPC_URL);
      return await this.forwarderContract.connect(provider).verify(request, signature);
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
    voteType: number,
    signer: ethers.Signer,
    provider: ethers.Provider
  ): Promise<ethers.TransactionResponse> {
    try {
      // Create the vote data
      const daoInterface = new ethers.Interface([
        'function castVoteByMetaTx(address from, uint256 proposalId, uint8 voteType, uint256 deadline, bytes calldata signature)'
      ]);

      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
      const data = daoInterface.encodeFunctionData('castVoteByMetaTx', [
        from,
        proposalId,
        voteType,
        deadline,
        '0x' // Signature will be added by the forwarder
      ]);

      // Create forward request
      const request = this.createForwardRequest(
        from,
        Env.DAO_VOTING_ADDRESS,
        data,
        500000,
        30
      );

      // Sign the request
      const signature = await this.signForwardRequest(request, signer);

      // Execute the meta-transaction
      return await this.executeMetaTransaction(request, signature, provider);
    } catch (error) {
      console.error('Error creating DAO vote meta-transaction:', error);
      throw new Error('Failed to create vote meta-transaction');
    }
  }

  /**
   * Helper to create and send a meta-transaction for proposal creation
   */
  async createProposalMetaTransaction(
    from: string,
    description: string,
    signer: ethers.Signer,
    provider: ethers.Provider
  ): Promise<ethers.TransactionResponse> {
    try {
      // Create the proposal data
      const daoInterface = new ethers.Interface([
        'function createProposalByMetaTx(address from, string description, uint256 deadline, bytes calldata signature)'
      ]);

      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
      const data = daoInterface.encodeFunctionData('createProposalByMetaTx', [
        from,
        description,
        deadline,
        '0x' // Signature will be added by the forwarder
      ]);

      // Create forward request
      const request = this.createForwardRequest(
        from,
        Env.DAO_VOTING_ADDRESS,
        data,
        500000,
        30
      );

      // Sign the request
      const signature = await this.signForwardRequest(request, signer);

      // Execute the meta-transaction
      return await this.executeMetaTransaction(request, signature, provider);
    } catch (error) {
      console.error('Error creating proposal meta-transaction:', error);
      throw new Error('Failed to create proposal meta-transaction');
    }
  }
}

export const metaTransactionService = new MetaTransactionService();

export default MetaTransactionService;