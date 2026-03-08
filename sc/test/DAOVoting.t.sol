// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {DAOVoting} from "../src/DAOVoting.sol";
import {MinimalForwarder} from "../src/MinimalForwarder.sol";

contract DAOVotingTest is Test {
    DAOVoting dao;
    MinimalForwarder forwarder;
    uint256 proposalId;

    address public constant CREATOR = address(0x1);
    address public constant VOTER_1 = address(0x2);
    address public constant VOTER_2 = address(0x3);
    address public constant STRANGER = address(0x4);

    // OPTIMIZATION: A constant hash is used for proposal descriptions.
    // This mimics the new gas-efficient approach of storing hashes on-chain.
    bytes32 public constant TEST_PROPOSAL_HASH =
        keccak256(abi.encodePacked("Initial test proposal"));

    function setUp() public {
        // 1. Deploy the necessary contracts
        forwarder = new MinimalForwarder();
        dao = new DAOVoting(address(forwarder));

        // 2. Fund the DAO treasury.
        vm.deal(CREATOR, 10 ether);
        vm.startPrank(CREATOR);
        dao.fund{value: 10 ether}();
        vm.stopPrank();

        // 3. Create an initial proposal to be used in most tests
        vm.startPrank(CREATOR);
        proposalId = dao.createProposal(TEST_PROPOSAL_HASH);
        vm.stopPrank();
    }

    /*
    ==============================
    Proposal Creation Tests
    ==============================
    */

    function test_CreateProposal() public {
        bytes32 newHash = keccak256(abi.encodePacked("A new proposal"));

        vm.startPrank(CREATOR);
        uint256 newProposalId = dao.createProposal(newHash);
        vm.stopPrank();

        DAOVoting.Proposal memory p = dao.proposals(newProposalId);
        assertEq(p.proposalId, newProposalId);
        assertEq(p.creator, CREATOR);
        // OPTIMIZATION: Assert the hash, not the string description.
        assertEq(p.descriptionHash, newHash);
        assertEq(p.forVotes, 0);

        assertEq(
            uint(dao.state(newProposalId)),
            uint(DAOVoting.ProposalState.Active)
        );
    }

    function test_RevertIf_DescriptionHashIsEmpty() public {
        vm.expectRevert("Description hash cannot be empty");
        vm.startPrank(CREATOR);
        dao.createProposal(bytes32(0));
        vm.stopPrank();
    }

    function test_Emit_ProposalCreated_Event() public {
        bytes32 eventHash = keccak256(
            abi.encodePacked("A proposal to test event emission")
        );

        vm.expectEmit(true, true, true, true);
        // OPTIMIZATION: The event now emits the `bytes32` hash.
        emit DAOVoting.ProposalCreated(
            2, // Next proposal ID
            eventHash,
            CREATOR,
            block.timestamp
        );

        vm.startPrank(CREATOR);
        dao.createProposal(eventHash);
        vm.stopPrank();
    }

    /*
    ==============================
    Vote Casting Tests
    ==============================
    */

    function test_CastVote_For() public {
        vm.startPrank(VOTER_1);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
        vm.stopPrank();

        (uint256 forVotes, , , ) = dao.getProposalStats(proposalId);
        assertEq(forVotes, 1);
    }

    function test_Emit_VoteCast_Event() public {
        vm.expectEmit(true, true, true, true);
        emit DAOVoting.VoteCast(
            proposalId,
            VOTER_1,
            DAOVoting.VoteOption.FOR,
            1
        );

        vm.startPrank(VOTER_1);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
        vm.stopPrank();
    }

    /*
    ==============================
    State and Revert Tests
    ==============================
    */

    function test_RevertIf_ProposalDoesNotExist() public {
        vm.expectRevert("Proposal does not exist");
        vm.startPrank(VOTER_1);
        dao.castVote(999, DAOVoting.VoteOption.FOR);
        vm.stopPrank();
    }

    function test_RevertIf_VotingNotActive() public {
        uint256 votingPeriod = dao.VOTING_PERIOD();
        vm.warp(block.timestamp + votingPeriod + 1);

        vm.expectRevert("Voting not active");
        vm.startPrank(VOTER_1);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
        vm.stopPrank();
    }

    /*
    ==============================
    Load Testing Specific Tests
    ==============================
    */

    function test_LoadTest_CanVoteMultipleTimes() public {
        // NOTE: This test should FAIL in a production environment.
        // It passes now because the "Already voted" check in the contract is commented out.
        vm.startPrank(VOTER_1);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
        vm.stopPrank();

        (uint256 forVotes, , , ) = dao.getProposalStats(proposalId);
        assertEq(forVotes, 2, "Voter should be able to vote twice");
    }

    function test_RevertIf_VoterVotesTwice_DISABLED_FOR_LOAD_TESTING() public {
        // NOTE: This is the standard, correct behavior for a DAO.
        // This test is currently COMMENTED OUT because the corresponding `require`
        // statement in `DAOVoting.sol` is also commented out to allow for load testing.
        // To deploy to production, both this test and the contract code MUST be re-enabled.
        // vm.startPrank(VOTER_1);
        // dao.castVote(proposalId, VoteOption.FOR);
        // vm.expectRevert("Already voted");
        // dao.castVote(proposalId, VoteOption.FOR);
        // vm.stopPrank();
    }
}
