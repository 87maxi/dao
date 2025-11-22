import { type Hex, encodeFunctionData, parseEther, toHex } from 'viem';
import { NextRequest, NextResponse } from 'next/server';
import MinimalForwarder from '@/contracts/abis/MinimalForwarder.json';
import DAOVoting from '@/contracts/abis/DAOVoting.json';
import { Env } from '@/utils/config';
import { createPublicClient, http, createWalletClient, Hex, concatHex } from 'viem';
import { sepolia } from 'viem/chains';

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

// Create a public client for reading data
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(Env.RPC_URL)
});

// Create a wallet client for signing and sending transactions
const walletClient = createWalletClient({
  chain: sepolia,
  transport: http(Env.RPC_URL),
  account: Env.RELAYER_PRIVATE_KEY as Hex
});

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
    
    // Execute the transaction through the forwarder
    const hash = await walletClient.writeContract({
      address: Env.FORWARDER_CONTRACT_ADDRESS as Hex,
      abi: MinimalForwarder.abi,
      functionName: 'execute',
      args: [forwardRequest, signature]
    });
    
    // Wait for transaction to be mined
    const receipt = await publicClient.getTransactionReceipt({ hash });
    
    return NextResponse.json({
      success: true,
      txHash: hash,
      blockNumber: Number(receipt?.blockNumber),
      gasUsed: receipt?.gasUsed.toString(),
      status: receipt?.status === 'success' ? 'success' : 'failed'
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
    const network = await publicClient.getChainId();
    
    return NextResponse.json({
      success: true,
      status: 'active',
      network: 'sepolia',
      chainId: network,
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
  
  // Get nonce
  const nonce = await publicClient.readContract({
    address: Env.FORWARDER_CONTRACT_ADDRESS as Hex,
    abi: MinimalForwarder.abi,
    functionName: 'getNonce',
    args: [userAddress]
  });
  
  // Encode data for castVoteByMetaTx
  const data = encodeFunctionData({
    abi: DAOVoting.abi,
    functionName: 'castVoteByMetaTx',
    args: [
      userAddress,
      proposalId,
      voteType,
      deadline,
      '0x' // signature placeholder
    ]
  });

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
    chainId: sepolia.id,
    verifyingContract: Env.FORWARDER_CONTRACT_ADDRESS as Hex,
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
  
  // Get nonce
  const nonce = await publicClient.readContract({
    address: Env.FORWARDER_CONTRACT_ADDRESS as Hex,
    abi: MinimalForwarder.abi,
    functionName: 'getNonce',
    args: [userAddress]
  });
  
  // Encode data for createProposalByMetaTx
  const data = encodeFunctionData({
    abi: DAOVoting.abi,
    functionName: 'createProposalByMetaTx',
    args: [
      userAddress,
      description,
      deadline,
      '0x' // signature placeholder
    ]
  });

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
    chainId: sepolia.id,
    verifyingContract: Env.FORWARDER_CONTRACT_ADDRESS as Hex,
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