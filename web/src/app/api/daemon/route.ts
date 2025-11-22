import { NextRequest, NextResponse } from 'next/server';
import { Env } from '@/utils/config';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import DAOVoting from '@/contracts/abis/DAOVoting.json';

// Create a public client for reading data
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(Env.RPC_URL)
});

/**
 * Daemon endpoint to check and execute approved proposals
 * This should be called periodically (e.g., via cron job or interval)
 */
export async function GET(request: NextRequest) {
  console.log('🔵 [DEBUG] Checking proposals on Anvil');
  
  try {
    // Get chain information
    const chainId = await publicClient.getChainId();
    
    // Get all proposals
    const proposals = [];
    
    // We need to known the proposal count. This would typically be stored in the contract
    // For now, we'll assume we know the count or fetch it through another method
    // This is a limitation without direct access to contract state
    
    // Alternative: Try to fetch proposals until we get an error
    let proposalId = 1;
    let hasMore = true;
    
    while (hasMore && proposalId <= 100) { // Arbitrary limit to prevent infinite loop
      try {
        // Fetch proposal details
        const proposal = await publicClient.readContract({
          address: Env.DAO_VOTING_ADDRESS,
          abi: DAOVoting.abi,
          functionName: 'proposals',
          args: [BigInt(proposalId)]
        });
        
        const stats = await publicClient.readContract({
          address: Env.DAO_VOTING_ADDRESS,
          abi: DAOVoting.abi,
          functionName: 'getProposalStats',
          args: [BigInt(proposalId)]
        });
        
        const state = await publicClient.readContract({
          address: Env.DAO_VOTING_ADDRESS,
          abi: DAOVoting.abi,
          functionName: 'getProposalState',
          args: [BigInt(proposalId)]
        });
        
        proposals.push({
          id: proposalId,
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
        
        proposalId++;
      } catch (error) {
        console.log(`No more proposals found or error at proposal ${proposalId}:`, error);
        hasMore = false;
      }
    }
    
    return NextResponse.json({
      success: true,
      network: 'sepolia',
      chainId: chainId,
      rpcUrl: Env.RPC_URL,
      daoVotingAddress: Env.DAO_VOTING_ADDRESS,
      forwarderAddress: Env.FORWARDER_CONTRACT_ADDRESS,
      proposalCount: proposals.length,
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