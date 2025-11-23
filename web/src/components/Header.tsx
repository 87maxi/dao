"use client";

import ConnectWallet from "./ConnectWallet";
import Image from "next/image";

export default function Header() {
  return (
    <header className="flex justify-between items-center mb-12 border-b border-purple-500/30 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10">
          <Image
            src="/images/logo.svg"
            alt="DAO Logo"
            width={40}
            height={40}
          />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            DAO Web3
          </h1>
          <p className="text-purple-300 mt-1 text-sm">Decentralized Governance Platform</p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-400">Blockchain Secure</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ConnectWallet />
      </div>
    </header>
  );
}