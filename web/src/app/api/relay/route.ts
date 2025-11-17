import { ethers } from 'ethers';
import MinimalForwarder  from '@/contracts/abis/MinimalForwarder.json';
import DAOVoting   from '@/contracts/abis/DAOVoting.json';


const FORWARDER_ADDRESS = '0xYourForwarderContractAddress';
const DAO_VOTING_ADDRESS = '0xYourDAOVotingContractAddress';

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
 * Enviar transacción al relayer
 */
export async function relayTransaction(
  forwardRequest: ForwardRequest,
  signature: string,
  action: string
): Promise<RelayResponse> {
  try {
    const response = await fetch('/api/relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request: forwardRequest,
        signature,
        action
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to relay transaction');
    }

    return data;
  } catch (error) {
    console.error('Relay error:', error);
    throw error;
  }
}

/**
 * Crear forward request para votar
 */
export async function createVoteForwardRequest(
  userAddress: string,
  proposalId: number,
  voteType: number,
  deadline: number
): Promise<{ request: ForwardRequest; message: string }> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const forwarder = new ethers.Contract(FORWARDER_ADDRESS, MinimalForwarder, await provider.getSigner());
  
  // Obtener nonce
  const nonce = await forwarder.getNonce(userAddress);
  
  // Codificar datos para castVoteByMetaTx
  const daoVoting = new ethers.Contract(DAO_VOTING_ADDRESS, DAOVoting);
  const data = daoVoting.interface.encodeFunctionData('castVoteByMetaTx', [
    userAddress,
    proposalId,
    voteType,
    deadline,
    '0x' // signature placeholder
  ]);

  const request: ForwardRequest = {
    from: userAddress,
    to: DAO_VOTING_ADDRESS,
    value: '0',
    gas: '1000000',
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    data
  };

  // Crear el mensaje para firmar (EIP-712)
  const domain = {
    name: 'DAOMinimalForwarder',
    version: '1',
    chainId: (await provider.getNetwork()).chainId,
    verifyingContract: FORWARDER_ADDRESS,
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
 * Crear forward request para crear propuesta
 */
export async function createProposalForwardRequest(
  userAddress: string,
  description: string,
  deadline: number
): Promise<{ request: ForwardRequest; message: string }> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const forwarder = new ethers.Contract(FORWARDER_ADDRESS, MinimalForwarder, await provider.getSigner());
  
  // Obtener nonce
  const nonce = await forwarder.getNonce(userAddress);
  
  // Codificar datos para createProposalByMetaTx
  const daoVoting = new ethers.Contract(DAO_VOTING_ADDRESS, DAOVoting);
  const data = daoVoting.interface.encodeFunctionData('createProposalByMetaTx', [
    userAddress,
    description,
    deadline,
    '0x' // signature placeholder
  ]);

  const request: ForwardRequest = {
    from: userAddress,
    to: DAO_VOTING_ADDRESS,
    value: '0',
    gas: '1000000',
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    data
  };

  // Crear el mensaje para firmar (EIP-712)
  const domain = {
    name: 'DAOMinimalForwarder',
    version: '1',
    chainId: (await provider.getNetwork()).chainId,
    verifyingContract: FORWARDER_ADDRESS,
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
 * Verificar estado del relayer
 */
export async function checkRelayerStatus(): Promise<any> {
  const response = await fetch('/api/relay');
  return response.json();
}