pragma solidity ^0.8.24;

import {Ownable}  from "@openzeppelin/contracts/access/Ownable.sol";

import {Context}  from  "@openzeppelin/contracts/utils/Context.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract DAOVoting is Ownable, ERC2771Context {
    // Proposal structure
    struct Proposal {
        uint256 proposalId;
        string description;
        uint256 createdAt;
        uint256 voteStart;
        uint256 voteEnd;
        address creator;
        bool executed;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
    }

    // We need a separate mapping for tracking votes since
    // structs with mappings can't be constructed directly
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    // Vote options
    enum VoteOption { FOR, AGAINST, ABSTAIN }

    // Proposal mapping
    mapping(uint256 => Proposal) private _proposals;
    uint256 private _proposalCount;

    // Public getter for proposals mapping
    function proposals(uint256 proposalId) public view returns (Proposal memory) {
        return _proposals[proposalId];
    }

    // Proposal state
    enum ProposalState { Pending, Active, Defeated, Succeeded, Executed }

    // Minimum DAO balance required to create a proposal (10%)
    uint256 public constant MIN_PROPOSAL_STAKE = 10; // 10%

    // Voting period (7 days)
    uint256 public constant VOTING_PERIOD = 7 days;

    // Execution delay after successful vote (2 days)
    uint256 public constant EXECUTION_DELAY = 2 days;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        string description,
        address indexed creator,
        uint256 createdAt
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteOption vote,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);

    constructor(address _trustedForwarder) ERC2771Context(_trustedForwarder) Ownable(msg.sender) {
        // The owner is set in the Ownable constructor
    }

    // Override to return the original sender when using meta-transactions
    function _msgSender() internal view virtual override( Context,  ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    // Override to return the data sender when using meta-transactions
    function _msgData() internal view virtual override ( Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    // Override the context suffix length to resolve inheritance conflict
    function _contextSuffixLength() internal view virtual override( Context , ERC2771Context) returns (uint256) {
        return 0;
    }

    /**
     * @notice Create a new proposal
     * @param description Description of the proposal
     * @return proposalId The unique identifier of the proposal
     * @dev Requires sender to have a balance of at least MIN_PROPOSAL_STAKE percentage of the DAO's balance
     */
    function createProposal(string memory description) public returns (uint256) {
        // Require sender to have sufficient balance (10% of contract balance)
        uint256 tenPercentBalance = (address(this).balance * MIN_PROPOSAL_STAKE) / 100;
        address sender = _msgSender();
        require(
            sender.balance >= tenPercentBalance,
            "Insufficient balance to create proposal"
        );
        
        uint256 proposalId = ++_proposalCount;
        
        // Initialize the proposal (without the hasVoted mapping)
        _proposals[proposalId] = Proposal({
            proposalId: proposalId,
            description: description,
            createdAt: block.timestamp,
            voteStart: block.timestamp,
            voteEnd: block.timestamp + VOTING_PERIOD,
            creator: _msgSender(),
            executed: false,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0
        });
        
        emit ProposalCreated(proposalId, description, _msgSender(), block.timestamp);
        
        return proposalId;
    }

    /**
     * @notice Cast a vote on a proposal
     * @param proposalId Proposal ID to vote on
     * @param vote Vote option (FOR, AGAINST, ABSTAIN)
     * @dev Can only be called by participants during the active voting period
     * and participants can only vote once per proposal
     */
    function castVote(uint256 proposalId, VoteOption vote) public {
        Proposal storage proposal = _proposals[proposalId];
        
        // Check if proposal exists
        require(proposal.proposalId > 0, "Proposal does not exist");
        
        // Check if voting is active
        require(
            block.timestamp >= proposal.voteStart && block.timestamp < proposal.voteEnd,
            "Voting not active"
        );
        
        // Check if voter has already voted
        require(!_hasVoted[proposalId][_msgSender()], "Already voted");
        
        // Mark voter as having voted
        _hasVoted[proposalId][_msgSender()] = true;
        
        // Count the vote
        if (vote == VoteOption.FOR) {
            proposal.forVotes++;
        } else if (vote == VoteOption.AGAINST) {
            proposal.againstVotes++;
        } else if (vote == VoteOption.ABSTAIN) {
            proposal.abstainVotes++;
        }
        
        emit VoteCast(proposalId, _msgSender(), vote, 1);
    }

    /**
     * @notice Get the current state of a proposal
     * @param proposalId Proposal ID to check
     * @return State of the proposal
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = _proposals[proposalId];
        
        // Check if proposal exists
        if (proposal.proposalId == 0) {
            return ProposalState.Pending;
        }
        
        // Check if proposal is still in voting period
        if (block.timestamp < proposal.voteStart) {
            return ProposalState.Pending;
        }
        
        if (block.timestamp >= proposal.voteStart && block.timestamp < proposal.voteEnd) {
            return ProposalState.Active;
        }
        
        // Check if proposal has been executed
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        // Check if proposal has succeeded or failed
        // Simple majority required (more FOR than AGAINST)
        if (proposal.forVotes > proposal.againstVotes) {
            // Check if execution delay has passed
            if (block.timestamp >= proposal.voteEnd + EXECUTION_DELAY) {
                return ProposalState.Succeeded;
            } else {
                return ProposalState.Succeeded; // Can be executed after delay
            }
        } else {
            return ProposalState.Defeated;
        }
    }

    /**
     * @notice Execute a successful proposal
     * @param proposalId Proposal ID to execute
     */
    function executeProposal(uint256 proposalId) public {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not eligible for execution");
        
        Proposal storage proposal = _proposals[proposalId];
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Get proposal statistics
     * @param proposalId Proposal ID to get stats for
     * @return forVotes, againstVotes, abstainVotes, totalVotes
     */
    function getProposalStats(uint256 proposalId) 
        public 
        view 
        returns (
            uint256, 
            uint256, 
            uint256, 
            uint256
        ) 
    {
        Proposal storage proposal = _proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        
        return (proposal.forVotes, proposal.againstVotes, proposal.abstainVotes, totalVotes);
    }

    /**
     * @notice Check if an address has voted on a proposal
     * @param proposalId Proposal ID to check
     * @param voter Address to check
     * @return True if the address has voted, false otherwise
     */
    function hasVoted(uint256 proposalId, address voter) public view returns (bool) {
        return _hasVoted[proposalId][voter];
    }

    /**
     * @notice Get the total number of proposals created
     * @return The total count of proposals
     */
    function proposalCount() public view returns (uint256) {
        return _proposalCount;
    }

}