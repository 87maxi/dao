"use client";

import { useEffect } from "react";

interface ProposalVoteToastProps {
  voteResult: {
    success: boolean;
    txHash?: string;
    error?: string;
  } | null;
  onClose: () => void;
}

export function ProposalVoteToast({ voteResult, onClose }: ProposalVoteToastProps) {
  // Auto-dismiss successful votes after a delay
  useEffect(() => {
    if (voteResult?.success) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [voteResult?.success, onClose]);

  if (!voteResult) return null;

  return (
    <div className={`
      rounded-lg p-4 mb-4
      ${voteResult.success 
        ? 'bg-green-500/10 border border-green-500/20' 
        : 'bg-red-500/10 border border-red-500/20'
      }
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          {voteResult.success ? (
            <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
          <div>
            <p className={`text-sm font-medium ${voteResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {voteResult.success ? 'Vote Submitted!' : 'Vote Failed'}
            </p>
            {voteResult.success && voteResult.txHash && (
              <p className="text-xs text-slate-300 mt-1">
                Transaction: {voteResult.txHash.slice(0, 6)}...{voteResult.txHash.slice(-4)}
              </p>
            )}
            {voteResult.error && (
              <p className="text-xs text-slate-300 mt-1">{voteResult.error}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ProposalVoteToast;
