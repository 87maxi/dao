"use client";

import { useState } from 'react';
import { Header, FundingPanel, CreateProposal, ProposalList } from '@/components';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProposalCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header />

        <main className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <CreateProposal onProposalCreated={handleProposalCreated} />
            <ProposalList key={refreshTrigger} />
          </div>

          <div className="lg:col-span-1">
            <FundingPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
