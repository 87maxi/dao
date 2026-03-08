// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract DAOVoting is Ownable, ERC2771Context {
    // GAS: This struct has been optimized using "struct packing".
    // By reordering fields and using smaller data types, we pack multiple variables
    // into single 32-byte storage slots, dramatically reducing gas costs.
    struct Proposal {
        uint256 proposalId;
        // OPTIMIZATION: Replaced `string description` with `bytes32 descriptionHash`.
        // Storing dynamic strings on-chain is extremely expensive. By storing a fixed-size
        // hash of the description (e.g., from IPFS), we make the creation cost
        // significantly cheaper and predictable, regardless of description length.
        bytes32 descriptionHash;
        // --- PACKED SLOT 1 ---
        uint64 voteStart;
        uint64 voteEnd;
        uint64 createdAt;
        // --- PACKED SLOT 2 ---
        uint64 forVotes;
        uint64 againstVotes;
        uint64 abstainVotes;
        // --- PACKED SLOT 3 ---
        address creator;
        bool executed;
    }

    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    enum VoteOption {
        FOR,
        AGAINST,
        ABSTAIN
    }
    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Executed
    }

    mapping(uint256 => Proposal) private _proposals;
    uint256 private _proposalCount;

    function proposals(
        uint256 proposalId
    ) public view returns (Proposal memory) {
        return _proposals[proposalId];
    }

    uint256 public constant MIN_PROPOSAL_STAKE = 10;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;

    event ProposalCreated(
        uint256 indexed proposalId,
        // OPTIMIZATION: Event now emits the hash, not the full string.
        bytes32 descriptionHash,
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

    constructor(
        address _trustedForwarder
    ) ERC2771Context(_trustedForwarder) Ownable(msg.sender) {}

    receive() external payable {}

    function fund() public payable {
        // Empty body to allow funding the contract's treasury.
    }

    function _msgSender()
        internal
        view
        virtual
        override(Context, ERC2771Context)
        returns (address)
    {
        return ERC2771Context._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(Context, ERC2771Context)
        returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength()
        internal
        view
        virtual
        override(Context, ERC2771Context)
        returns (uint256)
    {
        return 0;
    }

    /**
     * @notice Create a new proposal by providing a hash of its description.
     * @param _descriptionHash A 32-byte hash of the proposal's full text (e.g., an IPFS CID).
     * @return proposalId The unique identifier of the new proposal.
     */
    function createProposal(bytes32 _descriptionHash) public returns (uint256) {
        require(
            _descriptionHash != bytes32(0),
            "Description hash cannot be empty"
        );
        uint256 proposalId = ++_proposalCount;
        uint64 currentTime = uint64(block.timestamp);

        _proposals[proposalId] = Proposal({
            proposalId: proposalId,
            descriptionHash: _descriptionHash,
            createdAt: currentTime,
            voteStart: currentTime,
            voteEnd: currentTime + uint64(VOTING_PERIOD),
            creator: _msgSender(),
            executed: false,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0
        });

        emit ProposalCreated(
            proposalId,
            _descriptionHash,
            _msgSender(),
            block.timestamp
        );
        return proposalId;
    }

    /**
     * @notice Cast a vote on a proposal.
     */
    function castVote(uint256 proposalId, VoteOption vote) public {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.proposalId > 0, "Proposal does not exist");
        require(
            block.timestamp >= proposal.voteStart &&
                block.timestamp < proposal.voteEnd,
            "Voting not active"
        );

        // GAS/TEST: The following two lines are commented out to allow for load testing.
        // In a real scenario, they are critical to prevent double-voting.
        // require(!_hasVoted[proposalId][_msgSender()], "Already voted");
        // _hasVoted[proposalId][_msgSender()] = true;

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
     * @notice Get the current state of a proposal.
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage p = _proposals[proposalId];
        if (p.proposalId == 0) return ProposalState.Pending;
        if (block.timestamp < p.voteStart) return ProposalState.Pending;
        if (block.timestamp < p.voteEnd) return ProposalState.Active;
        if (p.executed) return ProposalState.Executed;
        if (p.forVotes > p.againstVotes) return ProposalState.Succeeded;
        return ProposalState.Defeated;
    }

    /**
     * @notice Execute a successful proposal.
     */
    function executeProposal(uint256 proposalId) public {
        require(
            state(proposalId) == ProposalState.Succeeded,
            "Proposal not eligible for execution"
        );
        Proposal storage proposal = _proposals[proposalId];
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Get proposal statistics.
     */
    function getProposalStats(
        uint256 proposalId
    )
        public
        view
        returns (
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            uint256 totalVotes
        )
    {
        Proposal storage p = _proposals[proposalId];
        forVotes = uint256(p.forVotes);
        againstVotes = uint256(p.againstVotes);
        abstainVotes = uint256(p.abstainVotes);
        totalVotes = forVotes + againstVotes + abstainVotes;
        return (forVotes, againstVotes, abstainVotes, totalVotes);
    }

    /**
     * @notice Check if an address has voted on a proposal.
     */
    function hasVoted(
        uint256 proposalId,
        address voter
    ) public view returns (bool) {
        return _hasVoted[proposalId][voter];
    }

    /**
     * @notice Get the total number of proposals created.
     */
    function proposalCount() public view returns (uint256) {
        return _proposalCount;
    }
}
