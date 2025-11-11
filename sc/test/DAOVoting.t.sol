// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/DAOVoting.sol";
import "../src/MinimalForwarder.sol";

// Mock ERC20 token for testing
contract MockERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }
    
    function name() public view returns (string memory) {
        return _name;
    }
    
    function symbol() public view returns (string memory) {
        return _symbol;
    }
    
    function decimals() public pure returns (uint8) {
        return 18;
    }
    
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        _spendAllowance(from, to, amount);
        _transfer(from, to, amount);
        return true;
    }
    
    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(_balances[from] >= amount, "ERC20: transfer amount exceeds balance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        
        emit Transfer(from, to, amount);
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
    
    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            _approve(owner, spender, currentAllowance - amount);
        }
    }
    
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");
        
        _balances[account] += amount;
        _totalSupply += amount;
        emit Transfer(address(0), account, amount);
    }
}

contract DAOVotingTest is Test {
    DAOVoting dao;
    MinimalForwarder forwarder;
    MockERC20 token;
    address internal constant OWNER = address(0x123);
    address internal constant USER1 = address(0x456);
    address internal constant USER2 = address(0x789);
    address internal constant USER3 = address(0xabc);
    uint256 internal constant OWNER_PRIVATE_KEY = 1;
    uint256 internal constant USER1_PRIVATE_KEY = 2;
    uint256 internal constant USER2_PRIVATE_KEY = 3;
    
    function setUp() public {
        forwarder = new MinimalForwarder();
        token = new MockERC20("DAO Token", "DAO");
        // Mint tokens to users
        token.mint(OWNER, 1 ether);
        token.mint(USER1, 1 ether);
        token.mint(USER2, 1 ether);
        token.mint(USER3, 1 ether);
        
        dao = new DAOVoting(address(token));
    }
    
    function testCreateProposal() public {
        vm.prank(OWNER);
        dao.createProposal("Test proposal");
        
        assertEq(dao.proposalCount(), 1);
        
        (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 totalVotes) = dao.getProposalStats(1);
        assertEq(forVotes, 0);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);
        assertEq(totalVotes, 0);
        
        (, uint256 deadline, bool executed, uint256 remainingTime) = dao.getProposalState(1);
        assertTrue(deadline > block.timestamp);
        assertEq(executed, false);
        assertTrue(remainingTime > 0);
    }
    
    function testCreateProposalInsufficientBalance() public {
        vm.prank(USER3);
        vm.expectRevert("DAOVoting: insufficient balance to create proposal");
        dao.createProposal("Test proposal");
    }
    
    function testCastVote() public {
        // Create proposal
        vm.prank(OWNER);
        dao.createProposal("Test proposal");
        
        // Try to vote before voting period starts
        vm.expectRevert("DAOVoting: voting not started");
        vm.prank(USER1);
        dao.castVote(1, DAOVoting.VoteType.FOR);
        
        // Fast forward to voting period
        vm.warp(block.timestamp + 2 hours);
        
        // Cast vote
        vm.prank(USER1);
        dao.castVote(1, DAOVoting.VoteType.FOR);
        
        // Try to vote again
        vm.expectRevert("DAOVoting: already voted");
        vm.prank(USER1);
        dao.castVote(1, DAOVoting.VoteType.AGAINST);
        
        // Check votes
        (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 totalVotes) = dao.getProposalStats(1);
        assertEq(forVotes, 1 ether);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);
        assertEq(totalVotes, 1 ether);
        
        assertEq(dao.userProposalVotes(USER1), 1);
    }
    
    function testCastVoteInvalidProposal() public {
        vm.expectRevert("DAOVoting: invalid proposal ID");
        vm.prank(USER1);
        dao.castVote(999, DAOVoting.VoteType.FOR);
    }
    
    function testCastVoteInvalidVoteType() public {
        vm.prank(OWNER);
        dao.createProposal("Test proposal");
        
        vm.warp(block.timestamp + 2 hours);
        
        vm.expectRevert("DAOVoting: invalid vote type");
        vm.prank(USER1);
        // Try to cast to an invalid vote type (out of bounds)
        bytes memory data = abi.encodeWithSignature("castVote(uint256,uint8)", 1, 3);
        (bool success, ) = address(dao).call(data);
        assertFalse(success);
    }
    
    function testCastVoteBySig() public {
        // Create proposal
        vm.prank(OWNER);
        dao.createProposal("Test proposal");
        
        // Fast forward to voting period
        vm.warp(block.timestamp + 2 hours);
        
        // Create vote signature
            uint8 v;
        bytes32 r;
        bytes32 s;
        bytes32 domainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("DAOVoting")),
            keccak256(bytes("1")),
            block.chainid,
            address(dao)
        ));
        bytes32 structHash = keccak256(abi.encode(
            keccak256("CastVote(uint256 proposalId,uint8 voteType)"),
            1,
            uint8(DAOVoting.VoteType.FOR)
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        // Advance time to voting period
        vm.warp(block.timestamp + 2 hours);
        
        // Create vote signature
        // Create vote signature with vm.addr to create a valid address for signing
        address user1Addr = vm.addr(USER1_PRIVATE_KEY);
        (v, r, s) = vm.sign(USER1_PRIVATE_KEY, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Mint tokens to the user1 address so they have voting power
        token.mint(user1Addr, 1 ether);
        
        // Cast vote with signature
        dao.castVoteBySig(1, DAOVoting.VoteType.FOR, signature);
        
        // Check votes
        (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 totalVotes) = dao.getProposalStats(1);
        assertEq(forVotes, 1 ether);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);
        assertEq(totalVotes, 1 ether);
        
        assertEq(dao.userProposalVotes(user1Addr), 1);
    }
    
    function testCastVoteBySigInvalidSignature() public {
        // Create proposal
        vm.prank(OWNER);
        dao.createProposal("Test proposal");
        
        // Fast forward to voting period
        vm.warp(block.timestamp + 2 hours);
        
        // Invalid signature
        bytes memory signature = abi.encodePacked(
            bytes32(uint256(0)),
            bytes32(uint256(1)),
            uint8(27)
        );
        
        vm.expectRevert();
        dao.castVoteBySig(1, DAOVoting.VoteType.FOR, signature);
    }

    function testExecuteProposal() public {
        // Create proposal
        vm.prank(OWNER);
        dao.createProposal("Test proposal");
        
        // Fast forward to voting period
        vm.warp(block.timestamp + 2 hours);
        
        // Cast votes
        vm.prank(USER1);
        dao.castVote(1, DAOVoting.VoteType.FOR);
        
        vm.prank(USER2);
        dao.castVote(1, DAOVoting.VoteType.FOR);
        
        // Fast forward to after deadline
        vm.warp(block.timestamp + 25 hours);
        
        // Execute proposal
        dao.executeProposal(1);
        
        // Check proposal executed
        (, , bool executed, ) = dao.getProposalState(1);
        assertTrue(executed);
    }

    function testExecuteProposalNotApproved() public {
        // Create proposal
        vm.prank(OWNER);
        dao.createProposal("Test proposal");
        
        // Fast forward to voting period
        vm.warp(block.timestamp + 2 hours);
        
        // Cast votes against
        vm.prank(USER1);
        dao.castVote(1, DAOVoting.VoteType.AGAINST);
        
        // Fast forward to after deadline
        vm.warp(block.timestamp + 25 hours);
        
        vm.expectRevert("DAOVoting: proposal not approved");
        dao.executeProposal(1);
    }

    function testExecuteProposalAlreadyExecuted() public {
        // Create proposal
        vm.prank(OWNER);
        dao.createProposal("Test proposal");
        
        // Fast forward to voting period
        vm.warp(block.timestamp + 2 hours);
        
        // Cast votes
        vm.prank(USER1);
        dao.castVote(1, DAOVoting.VoteType.FOR);
        
        // Fast forward to after deadline
        vm.warp(block.timestamp + 25 hours);
        
        // Execute proposal
        dao.executeProposal(1);
        
        // Try to execute again
        vm.expectRevert("DAOVoting: proposal already executed");
        dao.executeProposal(1);
    }

    function testGetVotingPower() public {
        assertEq(dao.getVotingPower(OWNER), 1 ether);
        assertEq(dao.getVotingPower(USER1), 1 ether);
        
        // Test transfer
        vm.prank(OWNER);
        token.transfer(USER3, 0.5 ether);
        
        assertEq(dao.getVotingPower(USER3), 0.5 ether);
        assertEq(token.balanceOf(USER3), 0.5 ether);
        
        // Test mint
        token.mint(OWNER, 1 ether);
        assertEq(dao.getVotingPower(OWNER), 1.5 ether);
        
        // Test burn by transferring to zero address
        vm.prank(OWNER);
        token.transfer(address(0), 0.5 ether);
        assertEq(dao.getVotingPower(OWNER), 0.5 ether); // Previous 1.5 ether - 0.5 burned = 1 ether, but we transferred 0.5 so should be 1 ether - 0.5 transferred = 0.5 ether
    }

    function testGetProposalStats() public {
        // Create proposal
        vm.prank(OWNER);
        dao.createProposal("Test proposal");
        
        // Fast forward to voting period
        vm.warp(block.timestamp + 2 hours);
        
        // Cast votes
        vm.prank(USER1);
        dao.castVote(1, DAOVoting.VoteType.FOR);
        
        vm.prank(USER2);
        dao.castVote(1, DAOVoting.VoteType.AGAINST);
        
        vm.prank(USER3);
        dao.castVote(1, DAOVoting.VoteType.ABSTAIN);
        
        // Check stats
        (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 totalVotes) = dao.getProposalStats(1);
        assertEq(forVotes, 1 ether);
        assertEq(againstVotes, 1 ether);
        assertEq(abstainVotes, 1 ether);
        assertEq(totalVotes, 3 ether);
    }

    function testGetProposalState() public {
        // Create proposal
        vm.prank(OWNER);
        dao.createProposal("Test proposal");
        
        // Check initial state
        (uint256 createdAt, uint256 deadline, bool executed, uint256 remainingTime) = dao.getProposalState(1);
        assertEq(createdAt, block.timestamp);
        assertEq(deadline, block.timestamp + dao.VOTING_PERIOD());
        assertEq(executed, false);
        assertTrue(remainingTime > 0);
        
        // Fast forward to after deadline
        vm.warp(block.timestamp + 25 hours);
        
        // Check final state
        (createdAt, deadline, executed, remainingTime) = dao.getProposalState(1);
        assertEq(executed, false);
        assertEq(remainingTime, 0);
    }
}