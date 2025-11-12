"use client";

import ConnectWallet from '@/components/ConnectWallet';
import CreateProposal from '@/components/CreateProposal';
import ProposalList from '@/components/ProposalList';
import { Proposal } from '@/components/ProposalList';
import { useState } from 'react';

// Datos de ejemplo para propuestas
const initialProposals: Proposal[] = [
  {
    id: 1,
    title: "Upgrade Governance Contract",
    description: "Propose an upgrade to the DAO's governance contract to improve voting efficiency and add new features for proposal management.",
    creator: "0x1234567890123456789012345678901234567890",
    voteCount: 42,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "active"
  },
  {
    id: 2,
    title: "Allocate Budget for Marketing",
    description: "Request funding for a new marketing campaign to increase awareness and adoption of our platform.",
    creator: "0x2345678901234567890123456789012345678901",
    voteCount: 28,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: "active"
  },
  {
    id: 3,
    title: "Partnership with Web3 Foundation",
    description: "Formalize a partnership with the Web3 Foundation to collaborate on research and development initiatives.",
    creator: "0x3456789012345678901234567890123456789012",
    voteCount: 15,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "pending"
  },
  {
    id: 4,
    title: "Implement Bug Bounty Program",
    description: "Establish a bug bounty program to incentivize security researchers to find and report vulnerabilities in our codebase.",
    creator: "0x4567890123456789012345678901234567890123",
    voteCount: 67,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: "passed"
  },
  {
    id: 5,
    title: "Change Token Distribution",
    description: "Modify the token distribution model to better align incentives for long-term stakeholders.",
    creator: "0x5678901234567890123456789012345678901234",
    voteCount: 8,
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: "rejected"
  }
];

export default function Home() {
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [connected, setConnected] = useState(false);

  // Función para manejar la creación de nuevas propuestas
  const handleCreateProposal = (title: string, description: string, deadline: Date) => {
    const newProposal: Proposal = {
      id: proposals.length + 1,
      title,
      description,
      creator: "0x1234567890123456789012345678901234567890", // Esto vendría de la cuenta conectada
      voteCount: 0,
      deadline,
      status: "pending" as const
    };
    setProposals([newProposal, ...proposals]);
    alert('Proposal created successfully!');
  };

  // Función para manejar los votos
  const handleVote = (id: number) => {
    if (!connected) {
      alert('Please connect your wallet to vote');
      return;
    }
    
    setProposals(proposals.map(proposal => 
      proposal.id === id 
        ? { ...proposal, voteCount: proposal.voteCount + 1 } 
        : proposal
    ));
    alert(`Voted on proposal #${id}!`);
  };

  // Función para manejar la conexión
  const handleConnect = () => {
    setConnected(true);
  };

  // Función para manejar la desconexión
  const handleDisconnect = () => {
    setConnected(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            DAO Governance Platform
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Decentralized governance for the future. Create, vote on, and manage proposals in a transparent and secure manner.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <ConnectWallet 
              connected={connected} 
              onConnect={handleConnect} 
              onDisconnect={handleDisconnect} 
            />
            <CreateProposal 
              onCreateProposal={handleCreateProposal} 
              disabled={!connected} 
            />
          </div>
          
          <div className="lg:col-span-2">
            <ProposalList 
              proposals={proposals} 
              onVote={connected ? handleVote : undefined} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}