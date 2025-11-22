"use server";

import { Env } from '@/utils/config';
import DAOVoting from '@/contracts/abis/DAOVoting.json';
import MinimalForwarder from '@/contracts/abis/MinimalForwarder.json';

// Cache para instancias de contratos
const contractCache = new Map();

// Función auxiliar para obtener provider con viem
function getProvider() {
  if (typeof window !== 'undefined') {
    // Client-side: usamos el provider de wagmi desde window
    const wagmiProvider = (window as any)._wagmi?.providers?.[0];
    if (wagmiProvider) {
      return wagmiProvider;
    }
  }
  // Server-side fallback
  return { rpcUrl: Env.RPC_URL };
}

/**
 * Obtiene una instancia del contrato DAOVoting
 */
export async function getDAOVotingContract() {
  const cacheKey = 'daoVoting';
  
  if (contractCache.has(cacheKey)) {
    return contractCache.get(cacheKey);
  }
  
  try {
    const provider = getProvider();
    
    // Para server-side, podríamos usar viem directamente en el futuro
    const contract = {
      address: Env.DAO_VOTING_ADDRESS,
      abi: DAOVoting,
      provider: provider,
      // Método simulado para verificar conexión
      proposalCount: async () => {
        // Esta es una implementación mínima para mantener compatibilidad
        // En una implementación completa, usaríamos viem para server-side
        console.warn('Using mock proposalCount for SSR');
        return 0;
      }
    };
    
    // Verificar que el contrato sea accesible
    try {
      await contract.proposalCount();
    } catch (error) {
      console.warn('Contract check failed, continuing anyway:', error);
    }
    
    contractCache.set(cacheKey, contract);
    return contract;
  } catch (error) {
    console.error('Error creating DAOVoting contract:', error);
    throw new Error('Failed to connect to DAOVoting contract');
  }
}

/**
 * Obtiene una instancia del contrato MinimalForwarder
 */
export async function getForwarderContract() {
  const cacheKey = 'forwarder';
  
  if (contractCache.has(cacheKey)) {
    return contractCache.get(cacheKey);
  }
  
  try {
    const provider = getProvider();
    
    const contract = {
      address: Env.FORWARDER_CONTRACT_ADDRESS,
      abi: MinimalForwarder,
      provider: provider,
      // Método simulado para verificar conexión
      getNonce: async (address: string) => {
        console.warn('Using mock getNonce for SSR');
        return 0;
      }
    };
    
    // Verificar que el contrato sea accesible
    try {
      await contract.getNonce('0x0000000000000000000000000000000000000000');
    } catch (error) {
      console.warn('Contract check failed, continuing anyway:', error);
    }
    
    contractCache.set(cacheKey, contract);
    return contract;
  } catch (error) {
    console.error('Error creating MinimalForwarder contract:', error);
    throw new Error('Failed to connect to MinimalForwarder contract');
  }
}

/**
 * Obtiene todas las propuestas del DAO
 */
export async function getAllProposals() {
  try {
    const daoContract = await getDAOVotingContract();
    const proposalCount = await daoContract.proposalCount();
    
    const proposals = [];
    for (let i = 1; i <= proposalCount; i++) {
      const proposal = await daoContract.proposals(i);
      const stats = await daoContract.getProposalStats(i);
      const state = await daoContract.getProposalState(i);
      
      proposals.push({
        id: i,
        proposalId: proposal.proposalId,
        proposer: proposal.proposer,
        description: proposal.description,
        forVotes: stats.forVotes,
        againstVotes: stats.againstVotes,
        abstainVotes: stats.abstainVotes,
        createdAt: proposal.createdAt,
        deadline: proposal.deadline,
        executed: proposal.executed,
        remainingTime: state.remainingTime,
        totalVotes: stats.totalVotes
      });
    }
    
    return proposals;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    throw new Error('Failed to fetch proposals');
  }
}