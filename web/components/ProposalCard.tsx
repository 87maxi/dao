"use client";

import { useState } from 'react';
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

interface ProposalCardProps {
  proposal: Proposal;
  userVote: number; // 0: none, 1: yes, 2: no, 3: abstain
  onVote: (proposalId: string, vote: number) => Promise<void>;
}

const ProposalCard = ({ proposal, userVote, onVote }: ProposalCardProps) => {
  const { account } = useWeb3();
  const [loadingVote, setLoadingVote] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timeRemaining = proposal.deadline - Math.floor(Date.now() / 1000);
  const votingActive = timeRemaining > 0 && !proposal.executed;

  const handleVote = async (vote: number) => {
    if (!account || !votingActive || loadingVote !== null) return;
    
    setLoadingVote(vote);
    setError(null);
    try {
      await onVote(proposal.id, vote);
    } catch (err: any) {
      setError(err.message || 'Vote failed');
    } finally {
      setLoadingVote(null);
    }
  };

  const getVoteStatus = () => {
    if (proposal.executed) return 'Executed';
    if (timeRemaining <= 0) return 'Closed';
    return 'Active';
  };

  const getStatusColor = () => {
    const status = getVoteStatus();
    switch (status) {
      case 'Executed': return 'text-green-400';
      case 'Closed': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-white">Proposal #{proposal.id}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()} bg-black/20`}>
          {getVoteStatus()}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div>
          <p className="text-sm text-slate-300">Beneficiary</p>
          <p className="font-mono text-sm text-purple-400 truncate">{proposal.beneficiary}</p>
        </div>
        
        <div>
          <p className="text-sm text-slate-300">Amount</p>
          <p className="text-lg font-bold text-white">{proposal.amount} ETH</p>
        </div>

        <div>
          <p className="text-sm text-slate-300">Voting Deadline</p>
          <p className="text-sm text-slate-300">
            {new Date(proposal.deadline * 1000).toLocaleString()}
            {votingActive && (
              <span className="ml-2 text-yellow-400">
                ({Math.ceil(timeRemaining / 3600)}h remaining)
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3">
          <div className="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
            <p className="text-xs text-green-400">Yes</p>
            <p className="font-bold text-green-300">{proposal.votes.yes}</p>
          </div>
          <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
            <p className="text-xs text-red-400">No</p>
            <p className="font-bold text-red-300">{proposal.votes.no}</p>
          </div>
          <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
            <p className="text-xs text-yellow-400">Abstain</p>
            <p className="font-bold text-yellow-300">{proposal.votes.abstain}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {account && votingActive ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleVote(1)}
              disabled={loadingVote !== null}
              className={`flex-1 min-w-[80px] py-2 px-4 rounded-lg font-medium transition-colors duration-200
                ${userVote === 1 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'}
                ${loadingVote === 1 ? 'opacity-70' : ''}`}
            >
              {loadingVote === 1 ? 'Voting...' : 'Yes'}
            </button>
            
            <button
              onClick={() => handleVote(2)}
              disabled={loadingVote !== null}
              className={`flex-1 min-w-[80px] py-2 px-4 rounded-lg font-medium transition-colors duration-200
                ${userVote === 2 
                  ? 'bg-red-500 text-white' 
                  : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}
                ${loadingVote === 2 ? 'opacity-70' : ''}`}
            >
              {loadingVote === 2 ? 'Voting...' : 'No'}
            </button>
            
            <button
              onClick={() => handleVote(3)}
              disabled={loadingVote !== null}
              className={`flex-1 min-w-[80px] py-2 px-4 rounded-lg font-medium transition-colors duration-200
                ${userVote === 3 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'}
                ${loadingVote === 3 ? 'opacity-70' : ''}`}
            >
              {loadingVote === 3 ? 'Voting...' : 'Abstain'}
            </button>
          </div>
          
          {userVote > 0 && (
            <p className="text-sm text-blue-400 text-center">
              You voted: {userVote === 1 ? 'Yes' : userVote === 2 ? 'No' : 'Abstain'}
            </p>
          )}
        </div>
      ) : !account ? (
        <p className="text-slate-400 text-center py-2">Connect wallet to vote</p>
      ) : (
        <p className="text-slate-400 text-center py-2">Voting period closed</p>
      )}
    </div>
  );
};

export default ProposalCard;