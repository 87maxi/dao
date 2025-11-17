"use client";

import { format } from 'date-fns';

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
  status: 'active' | 'passed' | 'rejected' | 'pending';
  onVote?: (id: number) => void;
  userVoted?: boolean;
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
  userVoted = false
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Determina el color del botón de votación
  const getVoteButtonColor = () => {
    if (userVoted) {
      return 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed';
    }
    return 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700';
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
    
    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else {
      return `${hours}h left`;
    }
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="text-2xl font-bold text-blue-600">{voteCount}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Votes</div>
          </div>
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

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onVote?.(id)}
            disabled={status !== 'active' || userVoted}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 
                     transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed 
                     disabled:transform-none ${getVoteButtonColor()}`}
          >
            {userVoted ? 'Already Voted' : 'Vote Now'}
          </button>
          
          <button className="py-3 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 border border-gray-300">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}