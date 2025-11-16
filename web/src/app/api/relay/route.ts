// app/api/relay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY || '';
const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS || '';
const DAO_VOTING_ADDRESS = process.env.NEXT_PUBLIC_DAO_VOTING_ADDRESS || '';
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

// Cache para evitar procesamiento duplicado
const userLocks = new Map<string, number>();

const FORWARDER_ABI = [
  'function execute((address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data) req, bytes signature) payable returns (bool, bytes)',
  'function getNonce(address from) view returns (uint256)'
];

const DAO_VOTING_ABI = [
  'function getNonce(address from) view returns (uint256)',
  'function castVoteByMetaTx(address from, uint256 proposalId, uint8 voteType, uint256 deadline, bytes signature)',
  'function createProposalByMetaTx(address from, string description, uint256 deadline, bytes signature)',
  'function getVotingPower(address account) view returns (uint256)',
  'function hasVoted(uint256 proposalId, address voter) view returns (bool)'
];

// Timeout para locks (30 segundos)
const LOCK_TIMEOUT = 30 * 1000;

// Configuración para esta route
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Valida requests específicos para el contrato DAO Voting
 */
async function validateDAOVotingRequest(
  forwardRequest: any, 
  daoVoting: ethers.Contract, 
  action: string
) {
  console.log('🔍 Validating DAO Voting request...');
  
  // Decodificar los datos de la transacción para obtener los parámetros
  const iface = new ethers.Interface(DAO_VOTING_ABI);
  const decodedData = iface.parseTransaction({ data: forwardRequest.data });
  
  if (!decodedData) {
    throw new Error('Could not decode transaction data');
  }

  const userAddress = forwardRequest.from;
  
  console.log('  Function:', decodedData.name);
  console.log('  Args:', decodedData.args);

  // Validaciones específicas por función
  if (decodedData.name === 'castVoteByMetaTx') {
    const [from, proposalId, voteType, deadline, signature] = decodedData.args;
    
    // Verificar poder de voto
    const votingPower = await daoVoting.getVotingPower(userAddress);
    console.log('  Voting power:', votingPower.toString());
    
    if (votingPower === 0n) {
      throw new Error('User has no voting power');
    }

    // Verificar si ya votó
    const hasVoted = await daoVoting.hasVoted(proposalId, userAddress);
    console.log('  Has voted:', hasVoted);
    
    if (hasVoted) {
      throw new Error('User has already voted on this proposal');
    }

    // Verificar deadline
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    if (currentTime > deadline) {
      throw new Error('Signature deadline has expired');
    }

    console.log('✅ Vote validation passed');

  } else if (decodedData.name === 'createProposalByMetaTx') {
    const [from, description, deadline, signature] = decodedData.args;
    
    // Verificar poder de voto para crear propuestas
    const votingPower = await daoVoting.getVotingPower(userAddress);
    console.log('  Voting power for proposal:', votingPower.toString());
    
    // Verificar deadline
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    if (currentTime > deadline) {
      throw new Error('Signature deadline has expired');
    }

    console.log('✅ Proposal creation validation passed');
  }
}

// ✅ Asegúrate de que POST esté exportado correctamente
export async function POST(request: NextRequest) {
  let userAddress: string | null = null;
  
  try {
    const body = await request.json();
    const { request: forwardRequest, signature, action } = body;

    // Validaciones básicas
    if (!forwardRequest || !signature) {
      return NextResponse.json(
        { error: 'Missing request or signature' },
        { status: 400 }
      );
    }

    userAddress = forwardRequest.from.toLowerCase();

    // Verificar si el usuario ya tiene una transacción en proceso
    const userLock = userLocks.get(userAddress);
    if (userLock && Date.now() - userLock < LOCK_TIMEOUT) {
      return NextResponse.json(
        { error: 'Transaction already in progress for this user' },
        { status: 429 }
      );
    }

    // Agregar lock
    userLocks.set(userAddress, Date.now());

    // Validar configuración del relayer
    if (!RELAYER_PRIVATE_KEY) {
      console.error('RELAYER_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Relayer not configured' },
        { status: 500 }
      );
    }

    if (!FORWARDER_ADDRESS) {
      console.error('NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS not configured');
      return NextResponse.json(
        { error: 'Forwarder contract not configured' },
        { status: 500 }
      );
    }

    if (!DAO_VOTING_ADDRESS) {
      console.error('NEXT_PUBLIC_DAO_VOTING_ADDRESS not configured');
      return NextResponse.json(
        { error: 'DAO Voting contract not configured' },
        { status: 500 }
      );
    }

    // Conectar a la blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    const forwarder = new ethers.Contract(FORWARDER_ADDRESS, FORWARDER_ABI, relayer);
    const daoVoting = new ethers.Contract(DAO_VOTING_ADDRESS, DAO_VOTING_ABI, provider);

    console.log('🔁 Relaying transaction:');
    console.log('  From:', forwardRequest.from);
    console.log('  To:', forwardRequest.to);
    console.log('  Action:', action);
    console.log('  Gas:', forwardRequest.gas);
    console.log('  Nonce:', forwardRequest.nonce);
    console.log('  Value:', forwardRequest.value);

    // Verificar nonce en el forwarder
    const forwarderNonce = await forwarder.getNonce(forwardRequest.from);
    console.log('🔢 Nonce verification:');
    console.log('  Forwarder nonce:', forwarderNonce.toString());
    console.log('  Request nonce:', forwardRequest.nonce);

    // Validar nonce
    const requestedNonce = BigInt(forwardRequest.nonce);
    if (requestedNonce !== forwarderNonce) {
      console.error('❌ Nonce mismatch!');
      userLocks.delete(userAddress);
      return NextResponse.json(
        { 
          error: 'Nonce mismatch', 
          expected: forwarderNonce.toString(), 
          received: forwardRequest.nonce 
        },
        { status: 400 }
      );
    }

    // Validaciones específicas para DAO Voting
    if (forwardRequest.to.toLowerCase() === DAO_VOTING_ADDRESS.toLowerCase()) {
      await validateDAOVotingRequest(forwardRequest, daoVoting, action);
    }

    // Intentar estimar gas primero
    let gasEstimate;
    try {
      gasEstimate = await forwarder.execute.estimateGas(forwardRequest, signature);
      console.log('⛽ Gas estimate:', gasEstimate.toString());
    } catch (gasError) {
      console.error('❌ Gas estimation failed:', gasError);
      // Continuar con un límite de gas por defecto
    }

    // Ejecutar la meta-transacción
    const gasLimit = gasEstimate ? gasEstimate * 2n : 3000000n;
    
    console.log('🚀 Executing meta-transaction...');
    const tx = await forwarder.execute(forwardRequest, signature, {
      gasLimit: gasLimit
    });

    console.log('✅ Transaction sent:', tx.hash);

    // Esperar confirmación
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

    // Liberar el lock del usuario
    userLocks.delete(userAddress);

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString(),
      status: receipt.status === 1 ? 'success' : 'failed'
    });

  } catch (error: unknown) {
    console.error('❌ Error relaying transaction:', error);

    // Liberar el lock en caso de error
    if (userAddress) {
      userLocks.delete(userAddress);
      console.log('🔓 Unlocked user after error:', userAddress);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Proporcionar mensajes de error más específicos
    let statusCode = 500;
    let errorResponse = 'Failed to relay transaction';

    if (errorMessage.includes('Nonce mismatch')) {
      statusCode = 400;
      errorResponse = 'Nonce mismatch - please refresh and try again';
    } else if (errorMessage.includes('insufficient funds')) {
      statusCode = 402;
      errorResponse = 'Relayer has insufficient funds for gas';
    } else if (errorMessage.includes('already voted')) {
      statusCode = 400;
      errorResponse = 'User has already voted on this proposal';
    } else if (errorMessage.includes('voting period has ended')) {
      statusCode = 400;
      errorResponse = 'Voting period has ended for this proposal';
    } else if (errorMessage.includes('no voting power')) {
      statusCode = 400;
      errorResponse = 'User has no voting power (zero token balance)';
    } else if (errorMessage.includes('signature expired')) {
      statusCode = 400;
      errorResponse = 'Signature deadline has expired';
    }

    return NextResponse.json(
      {
        error: errorResponse,
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: statusCode }
    );
  }
}

// ✅ Asegúrate de que GET esté exportado correctamente
export async function GET(request: NextRequest) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Verificar conexión a la blockchain
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    
    // Verificar balance del relayer
    const relayerAddress = new ethers.Wallet(RELAYER_PRIVATE_KEY).address;
    const balance = await provider.getBalance(relayerAddress);
    
    return NextResponse.json({
      status: 'operational',
      network: {
        name: network.name,
        chainId: network.chainId,
        blockNumber: blockNumber
      },
      relayer: {
        address: relayerAddress,
        balance: ethers.formatEther(balance),
        lockedUsers: Array.from(userLocks.entries()).map(([user, timestamp]) => ({
          user,
          lockedAt: new Date(timestamp).toISOString(),
          secondsAgo: Math.floor((Date.now() - timestamp) / 1000)
        }))
      },
      contracts: {
        forwarder: FORWARDER_ADDRESS,
        daoVoting: DAO_VOTING_ADDRESS
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'degraded', 
        error: 'Unable to connect to blockchain',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

// ✅ Exportar OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}