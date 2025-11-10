// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DAOVoting
 * @dev A DAO voting system with gasless transactions support via ERC2771
 */
contract DAOVoting is ERC2771Context, ReentrancyGuard {
    using ECDSA for bytes32;

    enum VoteType { FOR, AGAINST, ABSTAIN }
    enum ProposalStatus { PENDING, ACTIVE, APPROVED, REJECTED, EXECUTED }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 creationTime;
        uint256 votingStartTime;
        uint256 votingEndTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalStatus status;
        uint256 executionTime;
        bytes callData;
        address target;
    }

    uint256 private _proposalIdCounter;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => VoteType)) public votes;

    uint256 public constant VOTING_DELAY = 1 days;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant EXECUTION_DELAY = 1 days;
    uint256 public constant MIN_PROPOSAL_THRESHOLD_PERCENT = 10; // 10%

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 votingStartTime,
        uint256 votingEndTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType vote,
        uint256 weight
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalStatusChanged(uint256 indexed proposalId, ProposalStatus status);

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    /**
     * @dev Create a new proposal
     * @param description Description of the proposal
     * @param target Target contract address for execution
     * @param callData Calldata for the target contract
     */
    function createProposal(
        string memory description,
        address target,
        bytes memory callData
    ) external payable nonReentrant returns (uint256) {
        require(bytes(description).length > 0, "Description cannot be empty");
        require(target != address(0), "Invalid target address");
        
        uint256 currentBalance = address(this).balance - msg.value;
        uint256 requiredBalance = (currentBalance * MIN_PROPOSAL_THRESHOLD_PERCENT) / 100;
        require(msg.value >= requiredBalance, "Insufficient proposal deposit");

        _proposalIdCounter++;
        uint256 proposalId = _proposalIdCounter;
        
        uint256 votingStartTime = block.timestamp + VOTING_DELAY;
        uint256 votingEndTime = votingStartTime + VOTING_PERIOD;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: _msgSender(),
            description: description,
            creationTime: block.timestamp,
            votingStartTime: votingStartTime,
            votingEndTime: votingEndTime,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            status: ProposalStatus.PENDING,
            executionTime: 0,
            callData: callData,
            target: target
        });

        emit ProposalCreated(proposalId, _msgSender(), description, votingStartTime, votingEndTime);
        
        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal
     * @param proposalId ID of the proposal
     * @param voteType Type of vote (FOR, AGAINST, ABSTAIN)
     */
    function castVote(uint256 proposalId, VoteType voteType) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp >= proposal.votingStartTime, "Voting not started");
        require(block.timestamp <= proposal.votingEndTime, "Voting ended");
        require(!hasVoted[proposalId][_msgSender()], "Already voted");

        hasVoted[proposalId][_msgSender()] = true;
        votes[proposalId][_msgSender()] = voteType;

        uint256 voteWeight = 1; // Simple 1 vote per address for now
        
        if (voteType == VoteType.FOR) {
            proposal.forVotes += voteWeight;
        } else if (voteType == VoteType.AGAINST) {
            proposal.againstVotes += voteWeight;
        } else if (voteType == VoteType.ABSTAIN) {
            proposal.abstainVotes += voteWeight;
        }

        emit VoteCast(proposalId, _msgSender(), voteType, voteWeight);
        
        // Update proposal status if voting ended
        _updateProposalStatus(proposalId);
    }

    /**
     * @dev Execute an approved proposal
     * @param proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.APPROVED, "Proposal not approved");
        require(block.timestamp >= proposal.votingEndTime + EXECUTION_DELAY, "Execution delay not passed");
        require(proposal.executionTime == 0, "Already executed");

        proposal.status = ProposalStatus.EXECUTED;
        proposal.executionTime = block.timestamp;

        // Execute the proposal
        (bool success, ) = proposal.target.call(proposal.callData);
        require(success, "Proposal execution failed");

        emit ProposalExecuted(proposalId);
        emit ProposalStatusChanged(proposalId, ProposalStatus.EXECUTED);
    }

    /**
     * @dev Get proposal details
     * @param proposalId ID of the proposal
     */
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory description,
        uint256 creationTime,
        uint256 votingStartTime,
        uint256 votingEndTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        ProposalStatus status,
        uint256 executionTime,
        address target
    ) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        
        return (
            proposal.id,
            proposal.proposer,
            proposal.description,
            proposal.creationTime,
            proposal.votingStartTime,
            proposal.votingEndTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.status,
            proposal.executionTime,
            proposal.target
        );
    }

    /**
     * @dev Get voting statistics for a proposal
     * @param proposalId ID of the proposal
     */
    function getVotingStats(uint256 proposalId) external view returns (
        uint256 totalVotes,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        uint256 participationRate
    ) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        
        totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        forVotes = proposal.forVotes;
        againstVotes = proposal.againstVotes;
        abstainVotes = proposal.abstainVotes;
        
        // Simple participation rate calculation (could be enhanced with actual member count)
        participationRate = totalVotes > 0 ? (totalVotes * 100) / (totalVotes + 10) : 0;
        
        return (totalVotes, forVotes, againstVotes, abstainVotes, participationRate);
    }

    /**
     * @dev Internal function to update proposal status
     * @param proposalId ID of the proposal
     */
    function _updateProposalStatus(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        
        if (block.timestamp > proposal.votingEndTime && proposal.status == ProposalStatus.PENDING) {
            uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
            
            if (totalVotes == 0) {
                proposal.status = ProposalStatus.REJECTED;
            } else if (proposal.forVotes > proposal.againstVotes) {
                proposal.status = ProposalStatus.APPROVED;
            } else {
                proposal.status = ProposalStatus.REJECTED;
            }
            
            emit ProposalStatusChanged(proposalId, proposal.status);
        }
    }

    /**
     * @dev Override _msgSender for ERC2771 support
     */
    function _msgSender() internal view virtual override returns (address) {
        return ERC2771Context._msgSender();
    }

    /**
     * @dev Override _msgData for ERC2771 support
     */
    function _msgData() internal view virtual override returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    /**
     * @dev Receive function to accept ETH deposits
     */
    receive() external payable {}

    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}