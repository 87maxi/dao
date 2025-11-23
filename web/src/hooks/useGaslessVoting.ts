"use client";

import { useState } from "react";
import { useAccount, usePublicClient } from 'wagmi';
import { hashTypedData, toHex, encodeFunctionData, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { formatEther } from 'viem';
import { useMetaTransactions } from './useMetaTransactions';

// Types for the gasless voting functionality
interface VoteParams {
  proposalId: number;
  support: 1 | 2 | 3; // 1 = for, 2 = against, 3 = abstain
}

interface VoteResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Configuration for the relayer endpoint - use relative path for same-origin API route
const RELAYER_ENDPOINT = '/api/relay';

export function useGaslessVoting() {
  const [isVoting, setIsVoting] = useState(false);
  const [voteResult, setVoteResult] = useState<VoteResponse | null>(null);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { signVote, clearSignature, error: metaTxError } = useMetaTransactions();

  // Cast to number in range 0-2 (for vote choice)
  const supportToNum = (support: 1 | 2 | 3): 0 | 1 | 2 => {
    return (support - 1) as 0 | 1 | 2;
  };

  // Submit vote via relayer
  const submitVote = async ({ proposalId, support }: VoteParams): Promise<VoteResponse> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsVoting(true);
    setVoteResult(null);

    try {
      // Sign the vote with meta-transaction
      const signatureData = await signVote(proposalId, support);
      
      if (!signatureData) {
        return { success: false, error: 'Failed to sign vote' };
      }

      // Prepare the relayer request
      const relayerRequest = {
        request: {
          from: signatureData.request.from,
          to: signatureData.request.to,
          data: signatureData.request.data,
          nonce: signatureData.request.nonce.toString(),
        },
        signature: signatureData.signature,
        // Chain ID (should match your current network)
        chainId: publicClient?.chain.id || 31337,
      };

      // Send to relayer
      const response = await fetch(RELAYER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(relayerRequest),
      });

      const result = await response.json();

      if (response.ok) {
        setVoteResult({
          success: true,
          txHash: result.txHash,
        });
        
        // Clear the signature data after successful submission
        clearSignature();
        
        return {
          success: true,
          txHash: result.txHash,
        };
      } else {
        throw new Error(result.error || 'Relayer submission failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setVoteResult({
        success: false,
        error: errorMessage,
      });
      
      console.error('Vote submission error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsVoting(false);
    }
  };

  return {
    isVoting,
    voteResult,
    submitVote,
    clearVoteResult: () => setVoteResult(null),
  };
}

export default useGaslessVoting;