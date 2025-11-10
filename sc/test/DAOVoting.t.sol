// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DAOVoting} from "../src/DAOVoting.sol";
import {MinimalForwarder} from "../src/MinimalForwarder.sol";

contract DAOVotingTest is Test {
    DAOVoting public dao;
    MinimalForwarder public forwarder;
    
    // Usar las cuentas por defecto de Anvil
    address public deployer = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // private key 0
    address public user1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;    // private key 1
    address public user2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;    // private key 2
    address public user3 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;    // private key 3
    
    TestTarget public target;
    
    uint256 constant VOTING_DELAY = 1 days;
    uint256 constant VOTING_PERIOD = 3 days;
    uint256 constant EXECUTION_DELAY = 1 days;
    
    function setUp() public {
        // Configurar saldos para las cuentas de Anvil
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);
        
        vm.prank(deployer);
        forwarder = new MinimalForwarder();
        
        vm.prank(deployer);
        dao = new DAOVoting(address(forwarder));
        
        target = new TestTarget();
        
        // Fund the DAO
        vm.deal(address(dao), 100 ether);
    }
    
    function test_Deployment() public view {
        assertEq(address(dao).balance, 100 ether);
    }
    
    function test_CreateProposal() public {
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        vm.prank(user1);
        uint256 proposalId = dao.createProposal{value: requiredDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        
        assertEq(proposalId, 1);
        
        (uint256 id, address proposer, string memory description, , , , , , , DAOVoting.ProposalStatus status, , ) = dao.getProposal(proposalId);
        
        assertEq(id, 1);
        assertEq(proposer, user1);
        assertEq(description, "Test Proposal");
        assertEq(uint256(status), uint256(DAOVoting.ProposalStatus.PENDING));
    }
    
    function test_CreateProposal_InsufficientDeposit() public {
        uint256 insufficientDeposit = (address(dao).balance * 5) / 100;
        
        vm.prank(user1);
        vm.expectRevert("Insufficient proposal deposit");
        dao.createProposal{value: insufficientDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
    }
    
    function test_CastVote() public {
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        vm.prank(user1);
        uint256 proposalId = dao.createProposal{value: requiredDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        
        vm.prank(user2);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        
        (uint256 totalVotes, uint256 forVotes, , , ) = dao.getVotingStats(proposalId);
        assertEq(totalVotes, 1);
        assertEq(forVotes, 1);
    }
    
    function test_CastVote_BeforeVotingPeriod() public {
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        vm.prank(user1);
        uint256 proposalId = dao.createProposal{value: requiredDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        
        vm.prank(user2);
        vm.expectRevert("Voting not started");
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
    }
    
    function test_CastVote_AfterVotingPeriod() public {
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        vm.prank(user1);
        uint256 proposalId = dao.createProposal{value: requiredDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        
        vm.warp(block.timestamp + VOTING_DELAY + VOTING_PERIOD + 1);
        
        vm.prank(user2);
        vm.expectRevert("Voting ended");
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
    }
    
    function test_CastVote_Twice() public {
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        vm.prank(user1);
        uint256 proposalId = dao.createProposal{value: requiredDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        
        vm.prank(user2);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.prank(user2);
        vm.expectRevert("Already voted");
        dao.castVote(proposalId, DAOVoting.VoteType.AGAINST);
    }
    
    function test_ExecuteProposal_Approved() public {
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        vm.prank(user1);
        uint256 proposalId = dao.createProposal{value: requiredDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        
        vm.prank(user2);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.warp(block.timestamp + VOTING_PERIOD + EXECUTION_DELAY + 1);
        
        vm.prank(user3);
        dao.executeProposal(proposalId);
        
        assertEq(target.getValue(), 100);
        
        (, , , , , , , , , DAOVoting.ProposalStatus status, , ) = dao.getProposal(proposalId);
        assertEq(uint256(status), uint256(DAOVoting.ProposalStatus.EXECUTED));
    }
    
    function test_ExecuteProposal_Rejected() public {
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        vm.prank(user1);
        uint256 proposalId = dao.createProposal{value: requiredDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        
        vm.prank(user2);
        dao.castVote(proposalId, DAOVoting.VoteType.AGAINST);
        
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        (, , , , , , , , , DAOVoting.ProposalStatus status, , ) = dao.getProposal(proposalId);
        assertEq(uint256(status), uint256(DAOVoting.ProposalStatus.REJECTED));
        
        vm.prank(user3);
        vm.expectRevert("Proposal not approved");
        dao.executeProposal(proposalId);
    }
    
    function test_ExecuteProposal_BeforeExecutionDelay() public {
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        vm.prank(user1);
        uint256 proposalId = dao.createProposal{value: requiredDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        
        vm.prank(user2);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        
        vm.prank(user3);
        vm.expectRevert("Execution delay not passed");
        dao.executeProposal(proposalId);
    }
    
    function test_GaslessVoting() public {
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        vm.prank(user1);
        uint256 proposalId = dao.createProposal{value: requiredDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user2,
            to: address(dao),
            value: 0,
            gas: 200000,
            nonce: forwarder.getNonce(user2),
            data: abi.encodeWithSignature("castVote(uint256,uint8)", proposalId, uint8(DAOVoting.VoteType.FOR))
        });
        
        bytes32 digest = getDigest(req);
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(2, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.prank(user3);
        forwarder.execute(req, signature);
        
        (uint256 totalVotes, uint256 forVotes, , , ) = dao.getVotingStats(proposalId);
        assertEq(totalVotes, 1);
        assertEq(forVotes, 1);
    }
    
    function test_GetVotingStats() public {
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        vm.prank(user1);
        uint256 proposalId = dao.createProposal{value: requiredDeposit}(
            "Test Proposal",
            address(target),
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        
        vm.prank(user2);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.prank(user3);
        dao.castVote(proposalId, DAOVoting.VoteType.AGAINST);
        
        (uint256 totalVotes, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 participationRate) = dao.getVotingStats(proposalId);
        
        assertEq(totalVotes, 2);
        assertEq(forVotes, 1);
        assertEq(againstVotes, 1);
        assertEq(abstainVotes, 0);
        assertTrue(participationRate > 0);
    }
    
    function getDigest(MinimalForwarder.ForwardRequest memory req) internal view returns (bytes32) {
        bytes32 typeHash = keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)");
        bytes32 structHash = keccak256(abi.encode(typeHash, req.from, req.to, req.value, req.gas, req.nonce, keccak256(req.data)));
        
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("MinimalForwarder")),
                keccak256(bytes("0.0.1")),
                block.chainid,
                address(forwarder)
            )
        );
        
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }
}

contract TestTarget {
    uint256 public value;
    bool public shouldRevert;
    
    function setValue(uint256 _value) external {
        if (shouldRevert) {
            revert("Execution failed");
        }
        value = _value;
    }
    
    function getValue() external view returns (uint256) {
        return value;
    }
    
    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }
}
