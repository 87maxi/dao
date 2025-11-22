pragma solidity ^0.8.24;

import {Test}  from "forge-std/Test.sol";
import {DAOVoting}  from "../src/DAOVoting.sol";

contract DAOVotingTest is Test {
    DAOVoting public dao;
    address public owner;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = vm.addr(1);
        user1 = vm.addr(2);
        user2 = vm.addr(3);
        
        // Deploy DAO with zero address as forwarder for testing
        dao = new DAOVoting(address(0));
        
        // Fund accounts for testing
        vm.deal(owner, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    function testCreateProposal() public {
        uint256 proposalId = dao.createProposal("Test Proposal");
        
        assertEq(proposalId, 1);
        
        DAOVoting.Proposal memory proposal = dao.proposals(proposalId);
        assertEq(proposal.description, "Test Proposal");
        assertEq(proposal.creator, address(this));
        assertEq(proposal.executed, false);
    }

    function testCreateProposalWithUser() public {
        vm.prank(owner);
        uint256 proposalId = dao.createProposal("Test Proposal");
        
        assertEq(proposalId, 1);
        
        DAOVoting.Proposal memory proposal = dao.proposals(proposalId);
        assertEq(proposal.description, "Test Proposal");
        assertEq(proposal.creator, owner);
    }

    function testCastVote() public {
        vm.prank(owner);
        uint256 proposalId = dao.createProposal("Test Proposal");
        
        vm.prank(user1);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
        
        (uint256 forVotes, , , uint256 totalVotes) = dao.getProposalStats(proposalId);
        assertEq(forVotes, 1);
        assertEq(totalVotes, 1);
        
        assertTrue(dao.hasVoted(proposalId, user1));
    }

    function testCannotVoteTwice() public {
        vm.prank(owner);
        uint256 proposalId = dao.createProposal("Test Proposal");
        
        vm.prank(user1);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
        
        vm.expectRevert(bytes("Already voted"));
        vm.prank(user1);
        dao.castVote(proposalId, DAOVoting.VoteOption.AGAINST);
    }

    function testCannotVoteOutsideVotingPeriod() public {
        vm.prank(owner);
        uint256 proposalId = dao.createProposal("Test Proposal");
        
        // Fast forward past voting period
        vm.warp(block.timestamp + 8 days);
        
        vm.expectRevert(bytes("Voting not active"));
        vm.prank(user1);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
    }

    function testProposalState() public {
        vm.prank(owner);
        uint256 proposalId = dao.createProposal("Test Proposal");
        
        // Check initial state
        assertEq(uint256(dao.state(proposalId)), 1); // Active
        
        // Vote for the proposal
        vm.prank(user1);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
        
        // Fast forward past voting period
        vm.warp(block.timestamp + 8 days);
        
        // Check state after voting period - should be Succeeded but not yet executable
        assertEq(uint256(dao.state(proposalId)), 3); // Succeeded 
        
        // Fast forward past execution delay
        vm.warp(block.timestamp + 3 days);
        
        // Now it should still be Succeeded and executable
        assertEq(uint256(dao.state(proposalId)), 3); // Succeeded
        
        // Execute proposal
        dao.executeProposal(proposalId);
        
        // Check final state
        assertEq(uint256(dao.state(proposalId)), 4); // Executed
    }

    function testExecuteProposal() public {
        vm.prank(owner);
        uint256 proposalId = dao.createProposal("Test Proposal");
        
        // Vote for proposal
        vm.prank(user1);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
        
        vm.prank(user2);
        dao.castVote(proposalId, DAOVoting.VoteOption.FOR);
        
        // Fast forward past voting period and execution delay
        vm.warp(block.timestamp + 10 days);
        
        dao.executeProposal(proposalId);
        
        DAOVoting.Proposal memory proposal = dao.proposals(proposalId);
        assertTrue(proposal.executed);
    }

    function testProposalDefeated() public {
        vm.prank(owner);
        uint256 proposalId = dao.createProposal("Test Proposal");
        
        // Vote against proposal
        vm.prank(user1);
        dao.castVote(proposalId, DAOVoting.VoteOption.AGAINST);
        
        vm.prank(user2);
        dao.castVote(proposalId, DAOVoting.VoteOption.AGAINST);
        
        // Fast forward past voting period
        vm.warp(block.timestamp + 8 days);
        
        // Proposal should be defeated
        assertEq(uint256(dao.state(proposalId)), 2); // Defeated
        
        // Should not be able to execute defeated proposal
        vm.expectRevert(bytes("Proposal not eligible for execution"));
        dao.executeProposal(proposalId);
    }
}