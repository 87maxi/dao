import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';
import MinimalForwarder from '@/contracts/abis/MinimalForwarder.json';
import DAOVoting from '@/contracts/abis/DAOVoting.json';
import { Env } from '@/utils/config';

export interface ForwardRequest {
  from: string;
  to: string;
  value: string;
  gas: string;
  nonce: string;
  deadline: string;
  data: string;
}

export interface RelayResponse {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  status?: string;
  error?: string;
  message?: string;
}

/**
 * POST handler for relaying transactions to Anvil
 */
export async function POST(request: NextRequest) {
  try {
    const { request: forwardRequest, signature, action } = await request.json();
    
    // Validate required fields
    if (!forwardRequest || !signature || !action) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: request, signature, or action' 
        }, 
        { status: 400 }
      );
    }
    
    // Create provider connected to Anvil
    const provider = new ethers.JsonRpcProvider(Env.RPC_URL);
    
    // Create contract instances
    const forwarder = new ethers.Contract(
      Env.FORWARDER_CONTRACT_ADDRESS,
      MinimalForwarder,
      provider
    );
    
    // Get signer with relayer private key
    const relayerWallet = new ethers.Wallet(Env.RELAYER_PRIVATE_KEY, provider);
    
    // Execute the transaction through the forwarder
    const tx = await forwarder.connect(relayerWallet).execute(
      forwardRequest,
      signature
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed.toString(),
      status: receipt?.status === 1 ? 'success' : 'failed'
    });
    
  } catch (error: any) {
    console.error('Relay transaction error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to relay transaction',
        details: error.stack 
      }, 
      { status: 500 }
    );
  }
}

/**
 * GET handler to check relayer status
 */
export async function GET(request: NextRequest) {
  try {
    const provider = new ethers.JsonRpcProvider(Env.RPC_URL);
    const network = await provider.getNetwork();
    
    return NextResponse.json({
      success: true,
      status: 'active',
      network: network.name,
      chainId: network.chainId,
      forwarderAddress: Env.FORWARDER_CONTRACT_ADDRESS,
      daoVotingAddress: Env.DAO_VOTING_ADDRESS,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Relayer status check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}

/**
 * Create forward request for voting
 */
export async function createVoteForwardRequest(
  userAddress: string,
  proposalId: number,
  voteType: number,
  deadline: number
): Promise<{ request: ForwardRequest; message: string }> {
  const provider = new ethers.JsonRpcProvider(Env.RPC_URL);
  const forwarder = new ethers.Contract(
    Env.FORWARDER_CONTRACT_ADDRESS,
    MinimalForwarder,
    provider
  );
  
  // Get nonce
  const nonce = await forwarder.getNonce(userAddress);
  
  // Encode data for castVoteByMetaTx
  const daoVoting = new ethers.Contract(
    Env.DAO_VOTING_ADDRESS,
    DAOVoting,
    provider
  );
  const data = daoVoting.interface.encodeFunctionData('castVoteByMetaTx', [
    userAddress,
    proposalId,
    voteType,
    deadline,
    '0x' // signature placeholder
  ]);

  const request: ForwardRequest = {
    from: userAddress,
    to: Env.DAO_VOTING_ADDRESS,
    value: '0',
    gas: '1000000',
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    data
  };

  // Create message for signing (EIP-712)
  const domain = {
    name: 'MinimalForwarder',
    version: '1',
    chainId: await provider.getNetwork().then(net => net.chainId),
    verifyingContract: Env.FORWARDER_CONTRACT_ADDRESS,
  };

  const types = {
    ForwardRequest: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'gas', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
  };

  const message = JSON.stringify({
    types,
    domain,
    primaryType: 'ForwardRequest',
    message: request,
  });

  return { request, message };
}

/**
 * Create forward request for creating proposal
 */
export async function createProposalForwardRequest(
  userAddress: string,
  description: string,
  deadline: number
): Promise<{ request: ForwardRequest; message: string }> {
  const provider = new ethers.JsonRpcProvider(Env.RPC_URL);
  const forwarder = new ethers.Contract(
    Env.FORWARDER_CONTRACT_ADDRESS,
    MinimalForwarder,
    provider
  );
  
  // Get nonce
  const nonce = await forwarder.getNonce(userAddress);
  
  // Encode data for createProposalByMetaTx
  const daoVoting = new ethers.Contract(
    Env.DAO_VOTING_ADDRESS,
    DAOVoting,
    provider
  );
  const data = daoVoting.interface.encodeFunctionData('createProposalByMetaTx', [
    userAddress,
    description,
    deadline,
    '0x' // signature placeholder
  ]);

  const request: ForwardRequest = {
    from: userAddress,
    to: Env.DAO_VOTING_ADDRESS,
    value: '0',
    gas: '1000000',
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    data
  };

  // Create message for signing (EIP-712)
  const domain = {
    name: 'MinimalForwarder',
    version: '1',
    chainId: await provider.getNetwork().then(net => net.chainId),
    verifyingContract: Env.FORWARDER_CONTRACT_ADDRESS,
  };

  const types = {
    ForwardRequest: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'gas', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
  };

  const message = JSON.stringify({
    types,
    domain,
    primaryType: 'ForwardRequest',
    message: request,
  });

  return { request, message };
}
