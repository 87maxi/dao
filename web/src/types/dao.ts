export interface Proposal {
  proposalId: bigint;
  description: string;
  createdAt: bigint;
  voteStart: bigint;
  voteEnd: bigint;
  creator: `0x${string}`;
  executed: boolean;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
}

export interface ProposalForm {
  title: string;
  description: string;
  options?: string[];
  duration?: number;
  deadline?: number; // Timestamp in seconds for when voting ends
}

export interface ProposalStats {
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  totalVotes: bigint;
}

export enum VoteOption {
  FOR = 1,
  AGAINST = 2,
  ABSTAIN = 3
}

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Defeated = 2,
  Succeeded = 3,
  Executed = 4
}
