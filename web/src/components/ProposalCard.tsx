"use client";

import { format } from 'date-fns';
import { VoteType } from './ProposalList';

/**
 * Interface para las props del componente ProposalCard
 */
interface ProposalCardProps {
  id: number;
  title: string;
  description: string;
  creator: string;
  voteCount: number;
  deadline: Date;
  status: 'active' | 'passed' | 'rejected' | 'pending' | 'executed';
  onVote?: (proposalId: number, voteType: VoteType, isGasless?: boolean) => void;
  userVoted?: boolean;
  forVotes?: number;
  againstVotes?: number;
  abstainVotes?: number;
  votingInProgress?: boolean;
  currentVoteType?: VoteType | null;
}

/**
 * Componente para mostrar una propuesta individual en el DAO
 * Diseño responsive con Tailwind CSS
 */
export default function ProposalCard({
  id,
  title,
  description,
  creator,
  voteCount,
  deadline,
  status,
  onVote,
  userVoted = false,
  forVotes = 0,
  againstVotes = 0,
  abstainVotes = 0,
  votingInProgress = false,
  currentVoteType = null
}: ProposalCardProps) {
  // Determina el color del estado según el status
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'executed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Formatea la dirección del creador para mostrar
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calcula el tiempo restante hasta el deadline
  const getTimeRemaining = () => {
    const now = new Date();
    const diff = new Date(deadline).getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  // Verifica si la votación está en progreso para este tipo específico
  const isVotingInProgress = (voteType: VoteType) => {
    return votingInProgress && currentVoteType === voteType;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
          <div className="mb-2 sm:mb-0">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm">
              Created by: <span className="font-mono">{formatAddress(creator)}</span>
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor()} whitespace-nowrap mt-2 sm:mt-0`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <p className="text-gray-700 mb-4 leading-relaxed">{description}</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 text-center">
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="text-2xl font-bold text-blue-600">{voteCount}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total Votes</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-lg font-bold text-green-600">{forVotes}</div>
            <div className="text-xs text-green-600 uppercase tracking-wider">For</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="text-lg font-bold text-red-600">{againstVotes}</div>
            <div className="text-xs text-red-600 uppercase tracking-wider">Against</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="text-lg font-bold text-yellow-600">{abstainVotes}</div>
            <div className="text-xs text-yellow-600 uppercase tracking-wider">Abstain</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="text-sm font-semibold text-gray-700">
              {format(new Date(deadline), 'MMM d, yyyy')}
            </div>
            <div className="text-xs text-gray-500">Deadline</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="text-sm font-semibold text-orange-600">{getTimeRemaining()}</div>
            <div className="text-xs text-gray-500">Time Left</div>
          </div>
        </div>

        {status === 'active' && onVote && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Cast your vote:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Vote FOR */}
              <button
                onClick={() => onVote(id, 'FOR', false)}
                disabled={userVoted || votingInProgress}
                className={`p-3 rounded-lg font-semibold text-white transition-all duration-200 
                         transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed 
                         disabled:transform-none flex items-center justify-center space-x-2
                         ${isVotingInProgress('FOR') 
                           ? 'bg-blue-400' 
                           : 'bg-green-500 hover:bg-green-600'}`}
              >
                {isVotingInProgress('FOR') ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Voting...</span>
                  </>
                ) : (
                  <span>Vote For</span>
                )}
              </button>

              {/* Vote AGAINST */}
              <button
                onClick={() => onVote(id, 'AGAINST', false)}
                disabled={userVoted || votingInProgress}
                className={`p-3 rounded-lg font-semibold text-white transition-all duration-200 
                         transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed 
                         disabled:transform-none flex items-center justify-center space-x-2
                         ${isVotingInProgress('AGAINST') 
                           ? 'bg-blue-400' 
                           : 'bg-red-500 hover:bg-red-600'}`}
              >
                {isVotingInProgress('AGAINST') ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Voting...</span>
                  </>
                ) : (
                  <span>Vote Against</span>
                )}
              </button>

              {/* Vote ABSTAIN */}
              <button
                onClick={() => onVote(id, 'ABSTAIN', false)}
                disabled={userVoted || votingInProgress}
                className={`p-3 rounded-lg font-semibold text-white transition-all duration-200 
                         transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed 
                         disabled:transform-none flex items-center justify-center space-x-2
                         ${isVotingInProgress('ABSTAIN') 
                           ? 'bg-blue-400' 
                           : 'bg-yellow-500 hover:bg-yellow-600'}`}
              >
                {isVotingInProgress('ABSTAIN') ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Voting...</span>
                  </>
                ) : (
                  <span>Abstain</span>
                )}
              </button>
            </div>

            {/* Gasless voting option */}
            {!userVoted && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-800 mb-2">Gasless Voting Options:</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    onClick={() => onVote(id, 'FOR', true)}
                    disabled={votingInProgress}
                    className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    Vote For (Gasless)
                  </button>
                  <button
                    onClick={() => onVote(id, 'AGAINST', true)}
                    disabled={votingInProgress}
                    className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    Vote Against (Gasless)
                  </button>
                  <button
                    onClick={() => onVote(id, 'ABSTAIN', true)}
                    disabled={votingInProgress}
                    className="px-3 py-2 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                  >
                    Abstain (Gasless)
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Gasless voting uses meta-transactions - no gas fees required!
                </p>
              </div>
            )}

            {userVoted && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-semibold">
                  ✓ You have already voted on this proposal
                </p>
              </div>
            )}
          </div>
        )}

        {status !== 'active' && onVote && userVoted && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              You voted on this proposal (Voting closed)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}