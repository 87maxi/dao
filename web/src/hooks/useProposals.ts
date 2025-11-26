'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Proposal } from '@/types/dao';
import DAOVotingABI from '@/contracts/abis/DAOVoting.json';

interface UseProposals {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useProposals(): UseProposals {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const fetchProposals = async () => {
    if (!publicClient) return;

    setLoading(true);
    setError(null);
    console.log(process.env.NEXT_PUBLIC_DAO_ADDRESS);
    
    try {
      // Leer el número total de propuestas
      const proposalCount = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_DAO_ADDRESS as `0x${string}`,
        abi: DAOVotingABI,
        functionName: 'proposalCount'
      });

      

      // Si no hay propuestas, retornar array vacío
      if (!proposalCount || proposalCount === BigInt(0)) {
        setProposals([]);
        setLoading(false);
        return;
      }

      // Convertir a número y limitar a 10 para evitar bucles largos en desarrollo
      const count = Number(proposalCount);
      const proposalIds = Array.from({ length: Math.min(count, 10) }, (_, i) => BigInt(i + 1));

      // Obtener todas las propuestas en paralelo
      const proposalPromises = proposalIds.map(id =>
        publicClient.readContract({
          address: process.env.NEXT_PUBLIC_DAO_ADDRESS as `0x${string}`,
          abi: DAOVotingABI,
          functionName: 'proposals',
          args: [id]
        })
      );

      const proposalsData = await Promise.all(proposalPromises);

      // Mapear los datos a la interfaz Proposal
      const formattedProposals: Proposal[] = proposalsData.map((data: any, index) => ({
        proposalId: proposalIds[index],
        description: data.description,
        createdAt: data.createdAt,
        voteStart: data.voteStart,
        voteEnd: data.voteEnd,
        creator: data.creator,
        executed: data.executed,
        forVotes: data.forVotes,
        againstVotes: data.againstVotes,
        abstainVotes: data.abstainVotes
      })).filter(proposal => 
        // Filtrar propuestas válidas y que están en curso o pendientes
        Date.now() <= Number(proposal.voteEnd) || 
        !proposal.executed
      ) as Proposal[];
      


      setProposals(formattedProposals);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to load proposals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch proposals on component mount and when address changes
  useEffect(() => {
    fetchProposals();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchProposals, 30000);
    return () => clearInterval(interval);
  }, [address, publicClient]);

  const refresh = () => {
    fetchProposals();
  };

  return { proposals, loading, error, refresh };
}

export default useProposals;