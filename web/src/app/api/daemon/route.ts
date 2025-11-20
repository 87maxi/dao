import { NextRequest, NextResponse } from 'next/server';
import { Env } from '@/utils/config';
import { ethers } from 'ethers';
import DAOVoting from '@/contracts/abis/DAOVoting.json';

/**
 * Daemon endpoint to check and execute approved proposals
 * This should be called periodically (e.g., via cron job or interval)
 */
export async function GET(request: NextRequest) {
  console.log('🔵 [DEBUG] Checking proposals on Anvil');
  
  try {
    const provider = new ethers.JsonRpcProvider(Env.RPC_URL);
    
    // Get network information
    const network = await provider.getNetwork();
    
    // Create contract instance
    const daoContract = new ethers.Contract(
      Env.DAO_VOTING_ADDRESS,
      DAOVoting,
      provider
    );
    
    // Get proposal count
    const proposalCount = await daoContract.proposalCount();
    
    // Get all proposals
    const proposals = [];
    for (let i = 1; i <= proposalCount; i++) {
      try {
        const proposal = await daoContract.proposals(i);
        const stats = await daoContract.getProposalStats(i);
        const state = await daoContract.getProposalState(i);
        
        proposals.push({
          id: i,
          proposalId: proposal.proposalId.toString(),
          proposer: proposal.proposer,
          description: proposal.description,
          forVotes: stats.forVotes.toString(),
          againstVotes: stats.againstVotes.toString(),
          abstainVotes: stats.abstainVotes.toString(),
          createdAt: proposal.createdAt.toString(),
          deadline: proposal.deadline.toString(),
          executed: proposal.executed,
          remainingTime: state.remainingTime.toString(),
          totalVotes: stats.totalVotes.toString()
        });
      } catch (error) {
        console.log(`Error fetching proposal ${i}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      network: network.name,
      chainId: network.chainId,
      rpcUrl: Env.RPC_URL,
      daoVotingAddress: Env.DAO_VOTING_ADDRESS,
      forwarderAddress: Env.FORWARDER_CONTRACT_ADDRESS,
      proposalCount: proposalCount.toString(),
      proposals: proposals,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [DEBUG Error]:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      suggestion: 'Asegúrate de que Anvil esté corriendo y tenga contratos deployados',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
