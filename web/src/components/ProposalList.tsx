"use client";

import { useState } from 'react';
import ProposalCard from './ProposalCard';

/**
 * Interface para una propuesta
 */
export interface Proposal {
  id: number;
  title: string;
  description: string;
  creator: string;
  voteCount: number;
  deadline: string | Date;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  userVoted?: boolean;
}

/**
 * Props para el componente ProposalList
 */
interface ProposalListProps {
  proposals: Proposal[];
  onVote?: (id: number) => void;
}

/**
 * Componente para listar múltiples propuestas del DAO
 * Diseño responsive con Tailwind CSS
 */
export default function ProposalList({ proposals, onVote }: ProposalListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'rejected' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar propuestas según el filtro y término de búsqueda
  const filteredProposals = proposals.filter(proposal => {
    // Aplicar filtro por estado
    if (filter !== 'all' && proposal.status !== filter) {
      return false;
    }

    // Aplicar filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        proposal.title.toLowerCase().includes(searchLower) ||
        proposal.description.toLowerCase().includes(searchLower) ||
        proposal.creator.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Contadores para cada estado
  const counts = {
    all: proposals.length,
    active: proposals.filter(p => p.status === 'active').length,
    passed: proposals.filter(p => p.status === 'passed').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
    pending: proposals.filter(p => p.status === 'pending').length,
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Proposals</h2>
        
        {/* Filtros y búsqueda */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'pending', 'passed', 'rejected'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 
                         ${filter === filterType 
                           ? 'bg-blue-500 text-white shadow-md' 
                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)} 
                <span className="ml-1 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {counts[filterType]}
                </span>
              </button>
            ))}
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full lg:w-64 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Lista de propuestas */}
      <div className="space-y-6">
        {filteredProposals.length > 0 ? (
          filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              id={proposal.id}
              title={proposal.title}
              description={proposal.description}
              creator={proposal.creator}
              voteCount={proposal.voteCount}
              deadline={new Date(proposal.deadline)}
              status={proposal.status}
              onVote={onVote}
              userVoted={proposal.userVoted}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : filter !== 'all' 
                  ? `No ${filter} proposals at the moment` 
                  : 'No proposals have been created yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}