"use client";

import { Header } from '@/components';
import FundingPanel from '@/components/FundingPanel';
import CreateProposal from '@/components/CreateProposal';
import ProposalList from '@/components/ProposalList';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header />
        
        <main className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <CreateProposal />
            <ProposalList />
          </div>
          
          <div className="lg:col-span-1">
            <FundingPanel 
              daoBalance="1,250.45" 
              userBalance="150.00" 
            />
          </div>
        </main>
      </div>
    </div>
  );
}