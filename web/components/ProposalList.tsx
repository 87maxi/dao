"use client";

import { useEffect, useState } from 'react';
import ProposalCard from './ProposalCard';
import { useWeb3 } from '@/hooks/useWeb3';

interface Proposal {
  id: string;
  beneficiary: string;
  amount: string;
  deadline: number;
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
  executed: boolean;
}

const ProposalList = () => {
  const { account, proposals, userVotes, isLoading, loadProposals, voteOnProposal } = useWeb3();
  
  useEffect(() => {
    if (account) {
      loadProposals();
    }
  }, [account, loadProposals]);

  const handleVote = async (proposalId: string, vote: number) => {
    await voteOnProposal(proposalId, vote);
    // Refresh proposals after voting
    await loadProposals();
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-semibold mb-4 text-white">Proposals</h2>
        <p className="text-slate-300">Loading proposals...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-semibold mb-4 text-white">Proposals</h2>
      
      {proposals.length === 0 ? (
        <p className="text-slate-300">No proposals yet. Be the first to create one!</p>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard 
              key={proposal.id} 
              proposal={proposal} 
              userVote={userVotes[proposal.id] || 0}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalList;