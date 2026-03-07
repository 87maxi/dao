import DAOVoting from "@/contracts/abis/DAOVoting.json";

// Contract addresses - these should be configured based on the network
export const DAO_CONTRACT_ADDRESS: `0x${string}` = process.env
  .NEXT_PUBLIC_DAO_ADDRESS as `0x${string}`;

export const DAO_CONTRACT = {
  address: process.env.NEXT_PUBLIC_DAO_ADDRESS as `0x${string}`,
  abi: DAOVoting,
} as const;
