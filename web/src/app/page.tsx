"use client"

import { Hex } from 'viem';
import { useEffect, useState } from 'react';
import { apiService, ApiProposal } from '@/lib/apiService';
import '@/styles/web3.css';
import ConnectWallet from '@/components/ConnectWallet.viem';
import FundingPanel from '@/components/FundingPanel';
import CreateProposal from '@/components/CreateProposal';
import ProposalList from '@/components/ProposalList';
import { getAllProposals } from '@/lib/contractUtils';

export default function HomePage() {
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState('10.5');
  const [daoBalance, setDaoBalance] = useState('135.2');

  useEffect(() => {
    async function fetchData() {
      try {
        // Primero obtener propuestas desde el contrato
        const contractProposals = await getAllProposals();
        
        // Formatear las propuestas para el UI
        const formattedProposals = contractProposals.map((p: any) => ({
          id: Number(p.id),
          description: p.description,
          proposer: p.proposer,
          updatedAt: Number(p.createdAt),
          deadline: Number(p.deadline),
          executed: p.executed,
          forVotes: p.forVotes?.toString() || '0',
          againstVotes: p.againstVotes?.toString() || '0',
          abstainVotes: p.abstainVotes?.toString() || '0',
          totalVotes: p.totalVotes?.toString() || '0',
          // Añadir campos adicionales necesarios para el nuevo ProposalCard
          title: `Proposal #${p.id}`,
          voteCount: Number(p.totalVotes || 0),
          userVoted: false,
          status: p.executed ? 'executed' :
            (new Date() > new Date(Number(p.deadline) * 1000)) ? 'passed' : 'active',
        }));
        
        setProposals(formattedProposals);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching proposals:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Formatear la fecha
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toISOString().slice(0, 10);
  };
  
  // Simular depósito
  const handleDeposit = async (amount: string) => {
    // En una implementación real, esto interactuaría con el contrato
    console.log(`Depositing ${amount} ETH to DAO`);
    // Simular éxito después de breve delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Successfully deposited ${amount} ETH to DAO!`);
  };
  
  // Simular creación de propuesta
  const handleCreateProposal = async (data: { beneficiary: string; amount: string; deadline: Date; description: string }) => {
    console.log('Creating proposal:', data);
    // Simular éxito después de breve delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Proposal created successfully! Beneficiary: ${data.beneficiary}, Amount: ${data.amount} ETH`);
    
    // Refrescar propuestas (en una implementación real, esto escucharía eventos del contrato)
    // Por ahora, simplemente agregar la nueva propuesta al estado
    const newProposal = {
      id: proposals.length + 1,
      title: `Proposal #${proposals.length + 1}`,
      description: data.description,
      proposer: '0xf39...2266', // Simular dirección del usuario
      updatedAt: Math.floor(Date.now() / 1000),
      deadline: Math.floor(data.deadline.getTime() / 1000),
      executed: false,
      forVotes: '0',
      againstVotes: '0',
      abstainVotes: '0',
      totalVotes: '0',
      voteCount: 0,
      userVoted: false,
      status: 'active' as const,
    };
    setProposals(prev => [newProposal, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4">
      <div className="web3-container container mx-auto">
        <h1 className="text-4xl font-bold text-center my-8 gradient-text">DAO Dashboard</h1>
        
        <ConnectWallet />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FundingPanel 
            userBalance={userBalance}
            daoBalance={daoBalance}
            onDeposit={handleDeposit}
          />
          <CreateProposal 
            onCreate={handleCreateProposal}
            userBalance={userBalance}
            daoBalance={daoBalance}
          />
        </div>
        
        <ProposalList 
          proposals={proposals}
          // onVote={(proposalId, voteType, isGasless) => {
          //   console.log(`Voting ${voteType} on proposal ${proposalId} ${isGasless ? '(gasless)' : ''}`);
          //   // En implementación real, esto llamaría al contrato o API
          // }}
        />
      </div>
    </div>
  );
}