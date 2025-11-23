import DAOVoting from '@/contracts/abis/DAOVoting.json';

// Contract addresses - these should be configured based on the network
export const DAO_CONTRACT_ADDRESS: `0x${string}` = "0xCf44b25d375E0fd0A1EC5758f93Fabd4AcC9A0F4" as `0x${string}`;

export const DAO_CONTRACT = {
  address : "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  abi: DAOVoting
} as const;