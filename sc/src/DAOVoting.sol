// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title DAOVoting
 * @dev DAO contract with proposal management and voting system 
 * Supports gasless voting via EIP-2771 meta-transactions
 */
contract DAOVoting is Ownable, EIP712("DAOVoting", "1") {
    using ECDSA for bytes32;

    IERC20 public immutable TOKEN;
    address public trustedForwarder;
    
    // EIP-712 typehashes - CORREGIDOS
    bytes32 private constant _CAST_VOTE_TYPEHASH = 
        keccak256("CastVote(address from,uint256 proposalId,uint8 voteType,uint256 nonce,uint256 deadline)");

    bytes32 private constant _CREATE_PROPOSAL_TYPEHASH = 
        keccak256("CreateProposal(address from,string description,uint256 nonce,uint256 deadline)");

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
    mapping(address => uint256) public nonces;
    
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
        uint256 deadline,
        bool isMetaTx
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteType,
        uint256 votes,
        bool isMetaTx
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event TrustedForwarderUpdated(address indexed forwarder);

    constructor(address tokenAddress, address forwarder) Ownable(msg.sender) {
        TOKEN = IERC20(tokenAddress);
        trustedForwarder = forwarder;
    }
    
    /**
     * @dev Check if the caller is a trusted forwarder for EIP-2771
     */
    function isTrustedForwarder(address forwarder) public view returns (bool) {
        return forwarder == trustedForwarder;
    }
    
    /**
     * @dev Returns the msg.sender for EIP-2771 meta-transactions
     */
    function _msgSender() internal view virtual override returns (address) {
        address sender = msg.sender;
        
        // If called via trusted forwarder, extract the real sender from calldata
        if (isTrustedForwarder(sender)) {
            // The assembly code here extracts the address from the calldata
            // which is appended by the forwarder (last 20 bytes)
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        }
        return sender;
    }
    
    /**
     * @dev Updates the trusted forwarder address
     * @param forwarder The new trusted forwarder address
     */
    function setTrustedForwarder(address forwarder) external onlyOwner {
        require(forwarder != address(0), "DAOVoting: invalid forwarder");
        trustedForwarder = forwarder;
        emit TrustedForwarderUpdated(forwarder);
    }
    
    /**
     * @dev Creates a new proposal
     * @param description The proposal description
     */
    function createProposal(string memory description) external {
        address sender = _msgSender();
        _createProposal(sender, description, false);
    }
    
    /**
     * @dev Creates a new proposal via meta-transaction
     * @param from The original sender
     * @param description The proposal description
     * @param deadline The deadline for the meta-transaction
     * @param signature The signature for verification
     */
    function createProposalByMetaTx(
        address from,
        string memory description,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(isTrustedForwarder(msg.sender), "DAOVoting: untrusted forwarder");
        require(block.timestamp <= deadline, "DAOVoting: signature expired");
        
        // Verify the signature - VERSIÓN CORREGIDA
        bytes32 structHash = keccak256(
            abi.encode(
                _CREATE_PROPOSAL_TYPEHASH,
                from,
                keccak256(bytes(description)),
                nonces[from]++,
                deadline
            )
        );
        
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == from, "DAOVoting: invalid signature");
        
        _createProposal(from, description, true);
    }
    
    /**
     * @dev Internal function to create a proposal
     * @param proposer The address of the proposer
     * @param description The proposal description
     * @param isMetaTx Whether this is a meta-transaction
     */
    function _createProposal(address proposer, string memory description, bool isMetaTx) internal {
        require(TOKEN.balanceOf(proposer) >= MIN_PROPOSAL_THRESHOLD, "DAOVoting: insufficient balance to create proposal");
        
        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        
        proposal.proposalId = proposalCount;
        proposal.proposer = proposer;
        proposal.description = description;
        proposal.createdAt = block.timestamp;
        proposal.deadline = block.timestamp + VOTING_PERIOD;
        proposal.executed = false;
        
        emit ProposalCreated(proposalCount, proposer, description, proposal.deadline, isMetaTx);
    }
    
    /**
     * @dev Casts a vote on a proposal
     * @param proposalId The ID of the proposal
     * @param voteType The type of vote (FOR, AGAINST, ABSTAIN)
     */
    function castVote(uint256 proposalId, VoteType voteType) external {
        _castVote(_msgSender(), proposalId, voteType, false);
    }
    
    /**
     * @dev Casts a vote on a proposal with signature (gasless - EIP-712)
     * @param proposalId The ID of the proposal
     * @param voteType The type of vote (FOR, AGAINST, ABSTAIN)
     * @param signature The user's signature
     */
    function castVoteBySig(uint256 proposalId, VoteType voteType, bytes memory signature) external {
        // VERSIÓN CORREGIDA - Usando EIP-712
        bytes32 structHash = keccak256(
            abi.encode(
                _CAST_VOTE_TYPEHASH,
                _msgSender(),
                proposalId,
                voteType,
                nonces[_msgSender()]++,
                block.timestamp + 1 hours // 1 hour deadline for this signature
            )
        );
        
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == _msgSender(), "DAOVoting: invalid signature");
        
        _castVote(signer, proposalId, voteType, true);
    }
    
    /**
     * @dev Casts a vote via EIP-2771 meta-transaction
     * This function is called by the trusted forwarder
     * @param from The original sender of the transaction
     * @param proposalId The ID of the proposal
     * @param voteType The type of vote
     * @param deadline The deadline for the meta-transaction
     * @param signature The signature for verification
     */
    function castVoteByMetaTx(
        address from,
        uint256 proposalId,
        VoteType voteType,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(isTrustedForwarder(msg.sender), "DAOVoting: untrusted forwarder");
        require(block.timestamp <= deadline, "DAOVoting: signature expired");
        
        // Verify the signature - VERSIÓN CORREGIDA
        bytes32 structHash = keccak256(
            abi.encode(
                _CAST_VOTE_TYPEHASH,
                from,
                proposalId,
                voteType,
                nonces[from]++,
                deadline
            )
        );
        
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == from, "DAOVoting: invalid signature");
        
        _castVote(from, proposalId, voteType, true);
    }
    
    /**
     * @dev Internal function to cast a vote
     * @param voter The address of the voter
     * @param proposalId The ID of the proposal
     * @param voteType The type of vote
     * @param isMetaTx Whether this is a meta-transaction
     */
    function _castVote(address voter, uint256 proposalId, VoteType voteType, bool isMetaTx) internal {
        require(proposalId > 0 && proposalId <= proposalCount, "DAOVoting: invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.createdAt + VOTING_DELAY, "DAOVoting: voting not started");
        require(block.timestamp <= proposal.deadline, "DAOVoting: voting period has ended");
        require(!proposal.hasVoted[voter], "DAOVoting: already voted");
        require(voteType <= VoteType.ABSTAIN, "DAOVoting: invalid vote type");

        uint256 votes = TOKEN.balanceOf(voter);
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
        
        emit VoteCast(proposalId, voter, voteType, votes, isMetaTx);
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
     * @dev Returns the current nonce for an address (for meta-transactions)
     * @param from The address to get the nonce for
     * @return The current nonce
     */
    function getNonce(address from) external view returns (uint256) {
        return nonces[from];
    }
    
    /**
     * @dev Returns voting power of an address
     * @param account The address to check
     * @return The voting power
     */
    function getVotingPower(address account) external view returns (uint256) {
        return TOKEN.balanceOf(account);
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
    
    /**
     * @dev Returns whether an address has voted on a specific proposal
     * @param proposalId The ID of the proposal
     * @param voter The address of the voter
     * @return Whether the address has voted
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        require(proposalId > 0 && proposalId <= proposalCount, "DAOVoting: invalid proposal ID");
        return proposals[proposalId].hasVoted[voter];
    }
    
    /**
     * @dev Returns the domain separator for EIP-712
     * @return The domain separator
     */
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}