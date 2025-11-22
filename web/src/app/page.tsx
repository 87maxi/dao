"use client"
import { Hex } from 'viem';
import { useEffect, useState } from 'react';
import { apiService, ApiProposal } from '@/lib/apiService';
import '@/styles/web3.css';

export default function HomePage() {
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Crear instancia del servicio API
        const service = await apiService();
        
        // Usar el servicio API para obtener propuestas
        const result = await service.get<{ proposals: any[]; success: boolean; error?: string }>(`/api/daemon`);
        
        if (!result.success || !result.data?.success) {
          throw new Error(result.error || 'Failed to load proposals');
        }

        const apiProposals = result.data.proposals;
        
        const formattedProposals = apiProposals.map((p: any) => ({
          id: Number(p.id),
          description: p.description,
          proposer: p.proposer,
          updatedAt: Number(p.updatedAt),
          deadline: Number(p.deadline),
          executed: p.executed,
          forVotes: p.forVotes.toString(),
          againstVotes: p.againstVotes.toString(),
          abstainVotes: p.abstainVotes.toString(),
          totalVotes: p.totalVotes.toString(),
        }));
        
        setProposals(formattedProposals);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching proposals:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);// Formatear la fecha de manera simple
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toISOString().slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center my-8 gradient-text">DAO Dashboard</h1>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="card">
                <h2 className="text-xl font-semibold mb-2">Proposal {proposal.id}</h2>
                <p className="text-gray-600 mb-4">{proposal.description}</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Proposer:</span> <span className="address-display">{proposal.proposer}</span></p>
                  <p><span className="font-medium">Deadline:</span> {formatDate(proposal.deadline)}</p>
                  <p><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded-full text-xs font-bold ${proposal.executed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{proposal.executed ? 'Executed' : 'Active'}</span></p>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium mb-2">Votes</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-600">For: {proposal.forVotes}</p>
                    <p className="text-red-600">Against: {proposal.againstVotes}</p>
                    <p className="text-gray-600">Abstain: {proposal.abstainVotes}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}