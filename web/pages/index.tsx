import type { NextPage } from 'next';
import Head from 'next/head';
import ConnectWallet from '@/components/ConnectWallet';
import FundingPanel from '@/components/FundingPanel';
import CreateProposal from '@/components/CreateProposal';
import ProposalList from '@/components/ProposalList';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Head>
        <title>DAO Governance Platform</title>
        <meta name="description" content="Decentralized Autonomous Organization Governance" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            DAO Governance
          </h1>
          <p className="text-xl text-slate-300">
            Participate in decentralized decision making with gasless voting
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="space-y-8">
            <ConnectWallet />
            <FundingPanel />
          </div>
          <div className="space-y-8">
            <CreateProposal />
            <ProposalList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;