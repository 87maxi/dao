"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { hashTypedData, toHex, keccak256, encodeFunctionData } from 'viem';
import { DAO_CONTRACT } from '@/lib/contracts';
import MinimalForwarder from '@/contracts/abis/MinimalForwarder.json';

// Types for the proposal vote
interface ProposalVote {
  proposalId: bigint;
  support: 1 | 2 | 3; // 1 = for, 2 = against, 3 = abstain
}

// EIP-712 Typed Data structure
  const domain = {
  name: "DAOVoting",
  version: "1",
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337'),
  verifyingContract: process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`,
};

const types = {
  Vote: [
    { name: "proposalId", type: "uint256" },
    { name: "support", type: "uint8" },
  ],
} as const;

interface SignatureData {
  signature: `0x${string}`;
  request: {
    from: `0x${string}`;
    data: `0x${string}`;
    nonce: bigint;
  };
}



export function useMetaTransactions() {
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Get the nonce from the forwarder contract
  const getNonce = async (): Promise<bigint> => {
    if (!publicClient || !address) return 0n;
    
    try {
      // Get the nonce from the MinimalForwarder contract
      const nonce = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS as `0x${string}`,
        abi: MinimalForwarder,
        functionName: 'getNonce',
        args: [address],
      } as any);
      
      return nonce as bigint;
    } catch (err) {
      console.error('Failed to get nonce:', err);
      return 0n;
    }
  };

  // Generate the typed data for signing
  const generateTypedData = (vote: ProposalVote) => {
    return {
      domain,
      types,
      primaryType: 'Vote' as const,
      message: vote,
    };
  };

  // Sign the vote transaction
  const signVote = async (proposalId: number, support: 1 | 2 | 3) => {
    if (!walletClient || !address) {
      setError('Wallet not connected');
      return null;
    }
    
    setIsSigning(true);
    setError(null);
    setSignatureData(null);
    
    try {
      // Get nonce
      const nonce = await getNonce();
      
      // Create vote data
      const vote: ProposalVote = {
        proposalId: BigInt(proposalId),
        support,
      };
      
      // Generate typed data
      const typedData = generateTypedData(vote);
      
      // Get the digest hash
      const digest = hashTypedData(typedData);
      
      // Sign the digest with account parameter
      const signature = await walletClient.signTypedData({
        account: address,
        ...typedData
      });
      
      // Encode the function call data using proper ABI encoding
      const data = encodeFunctionData({
        abi: DAO_CONTRACT.abi,
        functionName: 'castVote',
        args: [vote.proposalId, vote.support]
      });
      
      // Create the transaction request structure expected by the relayer
      const request = {
        from: address,
        to: domain.verifyingContract,
        data,
        nonce: nonce,
      };
      
      const result = {
        signature,
        request,
      };
      
      setSignatureData(result);
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to sign: ${errorMessage}`);
      console.error('Signing error:', err);
      return null;
    } finally {
      setIsSigning(false);
    }
  };
  
  // Clear the signature data
  const clearSignature = () => {
    setSignatureData(null);
    setError(null);
  };
  
  return {
    isSigning,
    signatureData,
    error,
    signVote,
    clearSignature,
  };
}

export default useMetaTransactions;
