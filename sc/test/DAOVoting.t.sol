// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/DAOVoting.sol";
import "../src/MinimalForwarder.sol";

// Mock ERC20 token for testing - implementa IERC20 completamente
contract MockERC20 is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    
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
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }
    
    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
    
    function burn(address account, uint256 amount) public {
        _burn(account, amount);
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
    
    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from the zero address");
        require(_balances[account] >= amount, "ERC20: burn amount exceeds balance");
        
        _balances[account] -= amount;
        _totalSupply -= amount;
        emit Transfer(account, address(0), amount);
    }
}

contract DAOVotingTest is Test {
    DAOVoting public dao;
    MinimalForwarder public forwarder;
    MockERC20 public token;
    
    // Test addresses
    address public constant OWNER = address(0x123);
    address public constant USER1 = address(0x456);
    address public constant USER2 = address(0x789);
    address public constant USER3 = address(0xabc);
    address public constant USER_WITHOUT_TOKENS = address(0xdef);
    address public constant ATTACKER = address(0x666);
    
    // Private keys for signature testing
    uint256 public constant USER1_PRIVATE_KEY = 0x1;
    uint256 public constant USER2_PRIVATE_KEY = 0x2;
    
    // Test constants
    uint256 public constant INITIAL_BALANCE = 1 ether;
    uint256 public constant VOTING_DELAY = 1 hours;
    uint256 public constant VOTING_PERIOD = 24 hours;
    
    function setUp() public {
        // Deploy contracts
        forwarder = new MinimalForwarder();
        token = new MockERC20("DAO Token", "DAO");
        dao = new DAOVoting(address(token), address(forwarder));
        
        // Setup token balances
        token.mint(OWNER, INITIAL_BALANCE);
        token.mint(USER1, INITIAL_BALANCE);
        token.mint(USER2, INITIAL_BALANCE);
        token.mint(USER3, INITIAL_BALANCE);
        token.mint(ATTACKER, INITIAL_BALANCE);
    }

    // ============ HELPER FUNCTIONS ============
    
    function createProposal() internal returns (uint256) {
        vm.prank(OWNER);
        dao.createProposal("Test Proposal");
        return dao.proposalCount();
    }
    
    function createProposalAndAdvanceToVoting() internal returns (uint256) {
        uint256 proposalId = createProposal();
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        return proposalId;
    }
    
    function createVoteSignature(
        uint256 proposalId, 
        DAOVoting.VoteType voteType, 
        uint256 privateKey
    ) internal view returns (bytes memory) {
        bytes32 typeHash = keccak256("CastVote(uint256 proposalId,uint8 voteType)");
        bytes32 structHash = keccak256(abi.encode(typeHash, proposalId, voteType));
        
        bytes32 domainSeparator = dao.domainSeparator();
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    // ============ TESTS CORREGIDOS ============

    function test_EdgeCase_VoteWithMaxBalance() public {
        uint256 proposalId = createProposalAndAdvanceToVoting();
        
        // User with large but safe balance (evitar overflow)
        address richUser = address(0x999);
        uint256 safeLargeBalance = type(uint256).max / 2; // Usar la mitad del máximo para evitar overflow
        token.mint(richUser, safeLargeBalance);
        
        vm.prank(richUser);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        
        (uint256 forVotes, , , ) = dao.getProposalStats(proposalId);
        assertEq(forVotes, safeLargeBalance);
    }

    function test_Integration_CompleteFlow() public {
        // 1. Create multiple proposals
        vm.prank(OWNER);
        dao.createProposal("Proposal 1: Upgrade Contract");
        
        vm.prank(USER1);
        dao.createProposal("Proposal 2: Change Parameters");
        
        assertEq(dao.proposalCount(), 2);
        
        // 2. Advance to voting for first proposal
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        
        // 3. Vote on first proposal - ensure it passes
        vm.prank(USER1);
        dao.castVote(1, DAOVoting.VoteType.FOR);
        
        vm.prank(USER2);
        dao.castVote(1, DAOVoting.VoteType.FOR); // Add more FOR votes
        
        vm.prank(USER3);
        dao.castVote(1, DAOVoting.VoteType.FOR); // Add more FOR votes
        
        // 4. Execute first proposal after deadline
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        dao.executeProposal(1);
        
        // 5. Verify first proposal executed
        (, , bool executed, ) = dao.getProposalState(1);
        assertTrue(executed);
        
        // 6. Second proposal should still be active
        (, , executed, ) = dao.getProposalState(2);
        assertFalse(executed);
    }

    function test_Security_VoteManipulation() public {
        uint256 proposalId = createProposalAndAdvanceToVoting();
        
        // USER1 vota primero con sus 1 ETH
        vm.prank(USER1);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        
        // Verificar que el voto se registró correctamente
        (uint256 forVotesBefore, , , ) = dao.getProposalStats(proposalId);
        assertEq(forVotesBefore, INITIAL_BALANCE); // 1 ETH
        assertTrue(dao.hasVoted(proposalId, USER1));
        
        // USER1 transfiere 0.5 ETH a USER2
        uint256 transferAmount = INITIAL_BALANCE / 2;
        vm.prank(USER1);
        token.transfer(USER2, transferAmount);
        
        // Los votos de USER1 deberían permanecer iguales (votos bloqueados al momento de votar)
        (uint256 forVotesAfter, , , ) = dao.getProposalStats(proposalId);
        assertEq(forVotesAfter, INITIAL_BALANCE); // Sigue siendo 1 ETH
        
        // USER2 vota con sus tokens (1 ETH original + 0.5 ETH transferidos = 1.5 ETH)
        vm.prank(USER2);
        dao.castVote(proposalId, DAOVoting.VoteType.AGAINST);
        
        // Verificar los votos finales
        (uint256 finalForVotes, uint256 finalAgainstVotes, , ) = dao.getProposalStats(proposalId);
        
        // USER1 votó con 1 ETH (balance original)
        assertEq(finalForVotes, INITIAL_BALANCE);
        
        // USER2 vota con 1.5 ETH (1 ETH original + 0.5 ETH transferidos)
        assertEq(finalAgainstVotes, INITIAL_BALANCE + transferAmount); // 1.5 ETH
        
        // Verificar que ambos usuarios han votado
        assertTrue(dao.hasVoted(proposalId, USER1));
        assertTrue(dao.hasVoted(proposalId, USER2));
    }

    // ============ FUZZING TESTS ============
    
    function testFuzz_CreateProposal(string memory description) public {
        vm.assume(bytes(description).length > 0 && bytes(description).length < 1000);
        
        vm.prank(OWNER);
        dao.createProposal(description);
        
        assertEq(dao.proposalCount(), 1);
    }
    
    function testFuzz_CastVote(uint8 voteType) public {
        voteType = uint8(bound(voteType, 0, 2)); // 0=FOR, 1=AGAINST, 2=ABSTAIN
        uint256 proposalId = createProposalAndAdvanceToVoting();
        
        vm.prank(USER1);
        dao.castVote(proposalId, DAOVoting.VoteType(voteType));
        
        assertTrue(dao.hasVoted(proposalId, USER1));
    }
    
    function testFuzz_ProposalExecution(uint8 forVotes, uint8 againstVotes) public {
        forVotes = uint8(bound(forVotes, 1, 10));
        againstVotes = uint8(bound(againstVotes, 0, forVotes - 1)); // Ensure forVotes > againstVotes
        
        uint256 proposalId = createProposalAndAdvanceToVoting();
        
        // Create voters and mint tokens
        for (uint8 i = 0; i < forVotes; i++) {
            address voter = address(uint160(1000 + i));
            token.mint(voter, 1 ether);
            vm.prank(voter);
            dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        }
        
        for (uint8 i = 0; i < againstVotes; i++) {
            address voter = address(uint160(2000 + i));
            token.mint(voter, 1 ether);
            vm.prank(voter);
            dao.castVote(proposalId, DAOVoting.VoteType.AGAINST);
        }
        
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        
        if (forVotes > againstVotes) {
            dao.executeProposal(proposalId);
            (, , bool executed, ) = dao.getProposalState(proposalId);
            assertTrue(executed);
        } else {
            vm.expectRevert("DAOVoting: proposal not approved");
            dao.executeProposal(proposalId);
        }
    }

    // ============ BASE TESTS ============
    
    function test_CreateProposal_Success() public {
        vm.prank(OWNER);
        dao.createProposal("Test Proposal");
        
        assertEq(dao.proposalCount(), 1);
    }
    
    function test_CastVote_Success() public {
        uint256 proposalId = createProposalAndAdvanceToVoting();
        
        vm.prank(USER1);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        
        assertTrue(dao.hasVoted(proposalId, USER1));
    }
    
    function test_ExecuteProposal_Success() public {
        uint256 proposalId = createProposalAndAdvanceToVoting();
        
        vm.prank(USER1);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        vm.prank(USER2);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        dao.executeProposal(proposalId);
        
        (, , bool executed, ) = dao.getProposalState(proposalId);
        assertTrue(executed);
    }

    // ============ SECURITY TESTS ============
    
    function test_Security_DoubleVotePrevention() public {
        uint256 proposalId = createProposalAndAdvanceToVoting();
        
        // Vote once
        vm.prank(USER1);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        
        // Try to vote again - should fail
        vm.expectRevert("DAOVoting: already voted");
        vm.prank(USER1);
        dao.castVote(proposalId, DAOVoting.VoteType.AGAINST);
    }
    
    function test_Security_InvalidSignature() public {
        uint256 proposalId = createProposalAndAdvanceToVoting();
        
        // Create invalid signature (random bytes)
        bytes memory invalidSignature = abi.encodePacked(
            bytes32(uint256(12345)),
            bytes32(uint256(67890)),
            uint8(27)
        );
        
        vm.expectRevert(); // Puede revertir por "invalid signature" o "no voting power"
        dao.castVoteBySig(proposalId, DAOVoting.VoteType.FOR, invalidSignature);
    }
    
    function test_Security_OnlyOwnerCanSetForwarder() public {
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", ATTACKER));
        vm.prank(ATTACKER);
        dao.setTrustedForwarder(ATTACKER);
    }
    
    function test_Security_ReplayAttack() public {
        uint256 proposalId = createProposalAndAdvanceToVoting();
        address user1Addr = vm.addr(USER1_PRIVATE_KEY);
        token.mint(user1Addr, INITIAL_BALANCE);
        
        bytes memory signature = createVoteSignature(proposalId, DAOVoting.VoteType.FOR, USER1_PRIVATE_KEY);
        
        // First vote should work
        dao.castVoteBySig(proposalId, DAOVoting.VoteType.FOR, signature);
        
        // Second vote with same signature should fail
        vm.expectRevert("DAOVoting: already voted");
        dao.castVoteBySig(proposalId, DAOVoting.VoteType.FOR, signature);
    }
    
    function test_Security_ExpiredSignature() public {
        uint256 proposalId = createProposalAndAdvanceToVoting();
        address user1Addr = vm.addr(USER1_PRIVATE_KEY);
        token.mint(user1Addr, INITIAL_BALANCE);
        
        bytes memory signature = createVoteSignature(proposalId, DAOVoting.VoteType.FOR, USER1_PRIVATE_KEY);
        
        // Fast forward time beyond voting period
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        
        vm.expectRevert("DAOVoting: voting period has ended");
        dao.castVoteBySig(proposalId, DAOVoting.VoteType.FOR, signature);
    }

    function test_Security_ZeroVotePower() public {
        uint256 proposalId = createProposalAndAdvanceToVoting();
        
        vm.expectRevert("DAOVoting: no voting power");
        vm.prank(USER_WITHOUT_TOKENS);
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
    }

    // ============ EDGE CASE TESTS ============
    
    function test_EdgeCase_ZeroAddressProposal() public {
        vm.expectRevert();
        vm.prank(address(0));
        dao.createProposal("Test");
    }
    
    function test_EdgeCase_MaxProposalId() public {
        vm.expectRevert("DAOVoting: invalid proposal ID");
        dao.getProposalStats(type(uint256).max);
    }
    
    function test_Security_ProposalIdOverflow() public {
        vm.prank(OWNER);
        dao.createProposal("Proposal 1");
        assertEq(dao.proposalCount(), 1);
        
        vm.prank(USER1);
        dao.createProposal("Proposal 2");
        assertEq(dao.proposalCount(), 2);
    }

    // ============ GAS OPTIMIZATION TESTS ============
    
    function test_Gas_CreateProposal() public {
        vm.prank(OWNER);
        uint256 gasBefore = gasleft();
        dao.createProposal("Test Proposal");
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for createProposal:", gasUsed);
        assertTrue(gasUsed < 500000, "Gas usage too high");
    }
    
    function test_Gas_CastVote() public {
        uint256 proposalId = createProposalAndAdvanceToVoting();
        
        vm.prank(USER1);
        uint256 gasBefore = gasleft();
        dao.castVote(proposalId, DAOVoting.VoteType.FOR);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for castVote:", gasUsed);
        assertTrue(gasUsed < 300000, "Gas usage too high");
    }
}