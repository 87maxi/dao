"use server";

import { ethers } from 'ethers';
import { Env } from '@/utils/config';
import DAOVoting from '@/contracts/abis/DAOVoting.json';
import MinimalForwarder from '@/contracts/abis/MinimalForwarder.json';

// Cache para instancias de contratos
const contractCache = new Map();

/**
 * Obtiene una instancia del contrato DAOVoting
 */
export async function getDAOVotingContract() {
  const cacheKey = 'daoVoting';
  
  if (contractCache.has(cacheKey)) {
    return contractCache.get(cacheKey);
  }
  
  try {
    const provider = new ethers.JsonRpcProvider(Env.RPC_URL);
    const contract = new ethers.Contract(Env.DAO_VOTING_ADDRESS, DAOVoting, provider);
    
    // Verificar que el contrato sea accesible
    await contract.proposalCount();
    
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
    const provider = new ethers.JsonRpcProvider(Env.RPC_URL);
    const contract = new ethers.Contract(Env.FORWARDER_CONTRACT_ADDRESS, MinimalForwarder, provider);
    
    // Verificar que el contrato sea accesible
    await contract.getNonce(ethers.ZeroAddress);
    
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
