// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @dev DAO contract with gasless voting capabilities
 */
contract DAOVoting is Ownable, EIP712("DAOVoting", "1") {
    using ECDSA for bytes32;

    IERC20 public immutable token;
    
    struct Proposal {
        uint256 proposalId;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 createdAt;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    uint256 public constant MIN_PROPOSAL_THRESHOLD = 0.1e18; // 10% of DAO balance
    uint256 public constant VOTING_DELAY = 1 hours;
    uint256 public constant VOTING_PERIOD = 24 hours;
    
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public userProposalVotes;
    
    // Vote types
    enum VoteType { 
        FOR, 
        AGAINST, 
        ABSTAIN 
    }

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 deadline
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteType,
        uint256 votes
    );
    
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(address tokenAddress) Ownable(msg.sender) {
        token = IERC20(tokenAddress);
    }
    
    /**
     * @dev Creates a new proposal
     * @param description The proposal description
     */
    function createProposal(string memory description) external {
        require(token.balanceOf(msg.sender) >= MIN_PROPOSAL_THRESHOLD, "DAOVoting: insufficient balance to create proposal");
        
        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        
        proposal.proposalId = proposalCount;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.createdAt = block.timestamp;
        proposal.deadline = block.timestamp + VOTING_PERIOD;
        proposal.executed = false;
        
        emit ProposalCreated(proposalCount, msg.sender, description, proposal.deadline);
    }
    
    /**
     * @dev Casts a vote on a proposal
     * @param proposalId The ID of the proposal
     * @param voteType The type of vote (FOR, AGAINST, ABSTAIN)
     */
    function castVote(uint256 proposalId, VoteType voteType) external {
        _castVote(msg.sender, proposalId, voteType);
    }
    
    /**
     * @dev Casts a vote on a proposal with signature (gasless)
     * @param proposalId The ID of the proposal
     * @param voteType The type of vote (FOR, AGAINST, ABSTAIN)
     * @param signature The user's signature
     */
    function castVoteBySig(uint256 proposalId, VoteType voteType, bytes memory signature) external {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("CastVote(uint256 proposalId,uint8 voteType)"),
                proposalId,
                voteType
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        
        address signer = digest.recover(signature);
        require(signer != address(0), "DAOVoting: invalid signature");
        
        _castVote(signer, proposalId, voteType);
    }
    
    /**
     * @dev Internal function to cast a vote
     * @param voter The address of the voter
     * @param proposalId The ID of the proposal
     * @param voteType The type of vote
     */
    function _castVote(address voter, uint256 proposalId, VoteType voteType) internal {
        require(proposalId > 0 && proposalId <= proposalCount, "DAOVoting: invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.createdAt + VOTING_DELAY, "DAOVoting: voting not started");
        require(block.timestamp <= proposal.deadline, "DAOVoting: voting period has ended");
        require(!proposal.hasVoted[voter], "DAOVoting: already voted");
        require(voteType <= VoteType.ABSTAIN, "DAOVoting: invalid vote type");
        
        uint256 votes = token.balanceOf(voter);
        require(votes > 0, "DAOVoting: no voting power");
        
        proposal.hasVoted[voter] = true;
        userProposalVotes[voter]++;
        
        if (voteType == VoteType.FOR) {
            proposal.forVotes += votes;
        } else if (voteType == VoteType.AGAINST) {
            proposal.againstVotes += votes;
        } else if (voteType == VoteType.ABSTAIN) {
            proposal.abstainVotes += votes;
        }
        
        emit VoteCast(proposalId, voter, voteType, votes);
    }
    
    /**
     * @dev Executes a proposal if approved
     * @param proposalId The ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external {
        require(proposalId > 0 && proposalId <= proposalCount, "DAOVoting: invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.deadline, "DAOVoting: voting period not ended");
        require(!proposal.executed, "DAOVoting: proposal already executed");
        
        // Check if proposal is approved (simple majority)
        require(
            proposal.forVotes > proposal.againstVotes,
            "DAOVoting: proposal not approved"
        );
        
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Returns voting power of an address
     * @param account The address to check
     * @return The voting power
     */
    function getVotingPower(address account) external view returns (uint256) {
        return token.balanceOf(account);
    }
    
    /**
     * @dev Returns proposal statistics
     * @param proposalId The ID of the proposal
     * @return forVotes Number of votes for the proposal
     * @return againstVotes Number of votes against the proposal
     * @return abstainVotes Number of abstain votes
     * @return totalVotes Total number of votes
     */
    function getProposalStats(uint256 proposalId) external view returns (
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        uint256 totalVotes
    ) {
        require(proposalId > 0 && proposalId <= proposalCount, "DAOVoting: invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        
        return (proposal.forVotes, proposal.againstVotes, proposal.abstainVotes, totalVotes);
    }
    
    /**
     * @dev Returns proposal state
     * @param proposalId The ID of the proposal
     * @return createdAt Timestamp when the proposal was created
     * @return deadline Timestamp when the voting period ends
     * @return executed Whether the proposal has been executed
     * @return remainingTime Remaining time for voting in seconds
     */
    function getProposalState(uint256 proposalId) external view returns (
        uint256 createdAt,
        uint256 deadline,
        bool executed,
        uint256 remainingTime
    ) {
        require(proposalId > 0 && proposalId <= proposalCount, "DAOVoting: invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        
        if (block.timestamp >= proposal.deadline) {
            remainingTime = 0;
        } else {
            remainingTime = proposal.deadline - block.timestamp;
        }
        
        return (proposal.createdAt, proposal.deadline, proposal.executed, remainingTime);
    }
}
