"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { hashTypedData, toHex, keccak256, encodeFunctionData } from 'viem';

// Types for the proposal vote
interface ProposalVote {
  proposalId: bigint;
  support: 1 | 2 | 3; // 1 = for, 2 = against, 3 = abstain
}

// EIP-712 Typed Data structure
  const domain = {
  name: "DAOVoting",
  version: "1",
  chainId: 31337,
  verifyingContract: "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707" as `0x${string}`, // DAOVoting contract address
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

// ABI for the vote function
const voteAbi = [
  {
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "uint8" }
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

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
      // This would be a call to the forwarder contract
      // return await publicClient.readContract({
      //   address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      //   abi: minimalForwarderAbi,
      //   functionName: 'getNonce',
      //   args: [address],
      // })
      
      // For demo purposes, return a random nonce
      return BigInt(Math.floor(Math.random() * 1000000));
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
        abi: voteAbi,
        functionName: 'vote',
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
