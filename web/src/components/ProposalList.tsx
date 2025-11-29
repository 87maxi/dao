"use client";

import { useState } from "react";
import { useAccount, usePublicClient } from 'wagmi';
import ProposalCard from './ProposalCard';
import { useProposals } from '@/hooks/useProposals';

// Mock proposal data - in a real app, this would come from the smart contract
// Using static timestamps to prevent hydration mismatches
const BASE_TIMESTAMP = 1732850000000; // Fixed timestamp: Nov 29, 2024
const mockProposals = [
  {
    proposalId: 1n,
    description: "Upgrade to new governance token",
    createdAt: BigInt(BASE_TIMESTAMP - 86400000), // 1 day before base
    voteStart: BigInt(BASE_TIMESTAMP - 43200000), // 12 hours before base
    voteEnd: BigInt(BASE_TIMESTAMP + 172800000), // 2 days after base
    creator: "0x742d35Cc6634C0532925a3b8D4Cfb2B1b5412151" as `0x${string}`,
    executed: false,
    forVotes: 50n,
    againstVotes: 20n,
    abstainVotes: 5n
  },
  {
    proposalId: 2n,
    description: "Allocate funds for marketing campaign",
    createdAt: BigInt(BASE_TIMESTAMP - 172800000), // 2 days before base
    voteStart: BigInt(BASE_TIMESTAMP - 129600000), // 1.5 days before base
    voteEnd: BigInt(BASE_TIMESTAMP + 86400000), // 1 day after base
    creator: "0x37bd261E5bE21203d0Dc5B827D3017B1754458Af" as `0x${string}`,
    executed: false,
    forVotes: 30n,
    againstVotes: 40n,
    abstainVotes: 10n
  },
  {
    proposalId: 3n,
    description: "Add new project to investment portfolio",
    createdAt: BigInt(BASE_TIMESTAMP - 43200000), // 12 hours before base
    voteStart: BigInt(BASE_TIMESTAMP - 32400000), // 9 hours before base
    voteEnd: BigInt(BASE_TIMESTAMP + 259200000), // 3 days after base
    creator: "0x5015968b878d5e81B4Bd79C1787EF3B9bF51a79D" as `0x${string}`,
    executed: false,
    forVotes: 60n,
    againstVotes: 10n,
    abstainVotes: 3n
  }
];

export default function ProposalList() {
  const { address } = useAccount();
  
  // Use the custom hook to fetch real proposals from the blockchain
  const { proposals, loading, error, refresh } = useProposals();

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Active Proposals</h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-700/50 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Active Proposals</h2>
      
      {proposals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No proposals found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.proposalId.toString()} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}