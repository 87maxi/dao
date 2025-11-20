"use client";

import ConnectWallet from '@/components/ConnectWallet';
import CreateProposal from '@/components/CreateProposal';
import ProposalList from '@/components/ProposalList';
import { useState, useEffect } from 'react';
import  useWeb3  from '@/hooks/useWeb3';
import  useMetaTransactions  from '@/hooks/useMetaTransactions';
import { Env } from '@/utils/config';
import { ethers } from 'ethers';
import DAOVoting from '@/contracts/abis/DAOVoting.json';
import { VoteType } from '@/components/ProposalList';

export interface Proposal {
  id: number;
  title: string;
  description: string;
  creator: string;
  voteCount: number;
  deadline: Date;
  status: 'active' | 'passed' | 'rejected' | 'pending' | 'executed';
  userVoted?: boolean;
  forVotes?: number;
  againstVotes?: number;
  abstainVotes?: number;
}

export default function Home() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account, connected, getProvider, getSigner } = useWeb3();
  const { voteMetaTx } = useMetaTransactions();

  // Load proposals from blockchain on component mount and when connected state changes
  useEffect(() => {
    if (connected) {
      loadProposals();
      console.log('Wallet connected, loading proposals');
    } else {
      console.log('Wallet not connected, skipping proposal load');
      console.log('Account:', account);
      setError(null);
    }
  }, [connected, account?.address]);

  const loadProposals = async () => {
    console.log(Env.MODE_ENV);
    setLoading(true);
    setError(null);
    try {
      const provider = await getProvider();
      if (!provider) throw new Error('No provider available');
      
      const signer = await getSigner();
      const daoContract = new ethers.Contract(
        Env.DAO_VOTING_ADDRESS,
        DAOVoting,
        signer
      );
      
      // Get proposal count
      const proposalCount = await daoContract.proposalCount();
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      // Load each proposal
      const proposalsData: Proposal[] = [];
      for (let i = 1; i <= proposalCount; i++) {
        try {
          const proposal = await daoContract.proposals(i);
          
          // Get proposal state and details
          const deadline = Number(proposal.deadline);
          const executed = proposal.executed;
          const createdAt = Number(proposal.createdAt);
          
          // Convert timestamp to Date
          const deadlineDate = new Date(deadline * 1000);
          
          // Determine status
          let status: Proposal['status'] = 'pending';
          if (createdAt <= currentTimestamp) {
            if (executed) {
              status = 'executed';
            } else if (currentTimestamp > deadline) {
              // Check if proposal passed
              const stats = await daoContract.getProposalStats(i);
              status = Number(stats.forVotes) > Number(stats.againstVotes) ? 'passed' : 'rejected';
            } else {
              status = 'active';
            }
          }
          
          // Check if user has voted
          const hasVoted = account ? await daoContract.hasVoted(i, account.address) : false;
          
          // Get vote stats
          const stats = await daoContract.getProposalStats(i);
          
          proposalsData.push({
            id: i,
            title: proposal.description.substring(0, 50) + (proposal.description.length > 50 ? '...' : ''),
            description: proposal.description,
            creator: proposal.proposer,
            voteCount: Number(stats.forVotes) + Number(stats.againstVotes) + Number(stats.abstainVotes),
            deadline: deadlineDate,
            status,
            userVoted: hasVoted,
            forVotes: Number(stats.forVotes),
            againstVotes: Number(stats.againstVotes),
            abstainVotes: Number(stats.abstainVotes)
          });
        } catch (err) {
          console.warn(`Error loading proposal ${i}:`, err);
          continue; // Skip problematic proposals
        }
      }
      
      setProposals(proposalsData);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setError('Failed to load proposals. Please check your connection and try again.');
      
      // Set mock data for development only
      
        setProposals([
          {
            id: 1,
            title: 'Sample Proposal for Development',
            description: 'This is a sample proposal used for development and testing purposes.',
            creator: '0x1234567890123456789012345678901234567890',
            voteCount: 150,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'active',
            userVoted: false,
            forVotes: 100,
            againstVotes: 30,
            abstainVotes: 20
          }
        ]);
      
    } finally {
      setLoading(false);
    }
  };

  const refreshProposals = () => {
    if (connected) {
      loadProposals();
    }
  };

  // Handle voting on proposals
  const handleVote = async (proposalId: number, voteType: VoteType, isGasless: boolean = false): Promise<boolean> => {
    if (!connected || !account) {
      setError('Please connect your wallet to vote');
      return false;
    }

    try {
      setLoading(true);
      
      if (isGasless) {
        // Use meta-transaction for gasless voting
        const provider = await getProvider();
        const signer = await getSigner();
        
        if (!provider || !signer) {
          throw new Error('Failed to get provider or signer');
        }

        // Convert vote type to number (FOR: 0, AGAINST: 1, ABSTAIN: 2)
        const voteTypeNumber = voteType === 'FOR' ? 0 : voteType === 'AGAINST' ? 1 : 2;
        
        const tx = await voteMetaTx(proposalId, voteTypeNumber);
        if (!tx) {
          throw new Error('Failed to execute gasless vote');
        }
        
        await tx.wait();
      } else {
        // Use normal transaction
        const provider = await getProvider();
        const signer = await getSigner();
        
        if (!provider || !signer) {
          throw new Error('Failed to get provider or signer');
        }

        const daoContract = new ethers.Contract(
          Env.DAO_VOTING_ADDRESS,
          DAOVoting,
          signer
        );

        // Convert vote type to number
        const voteTypeNumber = voteType === 'FOR' ? 0 : voteType === 'AGAINST' ? 1 : 2;
        
        const tx = await daoContract.castVote(proposalId, voteTypeNumber);
        await tx.wait();
      }

      // Refresh proposals to show updated vote status
      await loadProposals();
      return true;
    } catch (error: any) {
      console.error('Error voting:', error);
      setError(error.message || 'Failed to vote. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DAO Voting Platform</h1>
          <ConnectWallet />
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-800 hover:text-red-900 font-bold"
            >
              ×
            </button>
          </div>
        )}
        
        {connected ? (
          <>
            <CreateProposal onCreateProposal={refreshProposals} />
            
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Proposals</h2>
                <button
                  onClick={refreshProposals}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading proposals...</p>
                </div>
              ) : proposals.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500">No proposals found.</p>
                </div>
              ) : (
                <ProposalList 
                  proposals={proposals} 
                  onVote={handleVote}
                />
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Welcome to DAO Voting
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to view proposals, vote, and create new proposals.
              </p>
              <ConnectWallet />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
