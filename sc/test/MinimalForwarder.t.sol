pragma solidity ^0.8.24;

import {Test} from  "forge-std/Test.sol";
import {MinimalForwarder} from  "../src/MinimalForwarder.sol";

contract Receiver {
    address public lastFrom;
    
    function executeMetaTx(address from, string calldata data) public {
        lastFrom = from;
    }
    
    function onERC2771MetaTransaction(address userAddress) public pure returns (bytes4) {
        return this.onERC2771MetaTransaction.selector;
    }
}

// Helper contract to access internal functions
contract ForwarderHelper is MinimalForwarder {
    constructor() MinimalForwarder() {}
    
    function getHashTypedDataV4(bytes32 structHash) public view returns (bytes32) {
        return _hashTypedDataV4(structHash);
    }
}

contract MinimalForwarderTest is Test {
    ForwarderHelper public forwarder;
    Receiver public receiver;
    
    address public owner;
    address public user;
    address public relayer;
    
    function setUp() public {
        owner = vm.addr(1);
        user = vm.addr(2);
        relayer = vm.addr(3);
        
        forwarder = new ForwarderHelper();
        receiver = new Receiver();
    }

    function testVerify() public {
        // Create a request
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user,
            to: address(receiver),
            value: 0,
            gas: 100000,
            nonce: 0,
            data: abi.encodeWithSignature("executeMetaTx(address,string)", user, "Hello World")
        });
        
        // Get the struct hash
        bytes32 structHash = keccak256(abi.encode(
            keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"),
            req.from,
            req.to,
            req.value,
            req.gas,
            req.nonce,
            keccak256(req.data)
        ));
        
        // Get the EIP-712 hash using the helper contract
        bytes32 digest = forwarder.getHashTypedDataV4(structHash);
        
        // Sign the digest
        uint256 userPrivateKey = 2;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Verify the signature
        bool isValid = forwarder.verify(req, signature);
        assertTrue(isValid);
    }

    function testExecuteMetaTransaction() public {
        // Create a request
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user,
            to: address(receiver),
            value: 0,
            gas: 100000,
            nonce: forwarder.getNonce(user),
            data: abi.encodeWithSignature("executeMetaTx(address,string)", user, "Hello World")
        });
        
        // Get the struct hash
        bytes32 structHash = keccak256(abi.encode(
            keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"),
            req.from,
            req.to,
            req.value,
            req.gas,
            req.nonce,
            keccak256(req.data)
        ));
        
        // Get the EIP-712 hash using the helper contract
        bytes32 digest = forwarder.getHashTypedDataV4(structHash);
        
        // Sign the digest
        uint256 userPrivateKey = 2;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Execute the meta-transaction
        vm.prank(relayer);
        forwarder.execute{value: req.value}(
            req,
            signature
        );
        
        // Check that the receiver got the correct from address
        assertEq(receiver.lastFrom(), user);
        
        // Check that the nonce was incremented
        assertEq(forwarder.getNonce(user), 1);
    }

    function testCannotExecuteWithWrongNonce() public {
        // Create a request with wrong nonce
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user,
            to: address(receiver),
            value: 0,
            gas: 100000,
            nonce: 999, // Wrong nonce
            data: abi.encodeWithSignature("executeMetaTx(address,string)", user, "Hello World")
        });
        
        // Get the struct hash
        bytes32 structHash = keccak256(abi.encode(
            keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"),
            req.from,
            req.to,
            req.value,
            req.gas,
            req.nonce,
            keccak256(req.data)
        ));
        
        // Get the EIP-712 hash using the helper contract
        bytes32 digest = forwarder.getHashTypedDataV4(structHash);
        
        // Sign the digest
        uint256 userPrivateKey = 2;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Try to execute - should fail
        vm.prank(relayer);
        vm.expectRevert(bytes("MinimalForwarder: invalid nonce"));
        forwarder.execute(req, signature);
    }

    function testCannotExecuteWithWrongSignature() public {
        // Create a request
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user,
            to: address(receiver),
            value: 0,
            gas: 100000,
            nonce: 0,
            data: abi.encodeWithSignature("executeMetaTx(address,string)", user, "Hello World")
        });
        
        // Get the struct hash
        bytes32 structHash = keccak256(abi.encode(
            keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"),
            req.from,
            req.to,
            req.value,
            req.gas,
            req.nonce,
            keccak256(req.data)
        ));
        
        // Get the EIP-712 hash using the helper contract
        bytes32 digest = forwarder.getHashTypedDataV4(structHash);
        
        // Sign with wrong private key
        uint256 wrongPrivateKey = 3;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Try to execute - should fail
        vm.prank(relayer);
        vm.expectRevert(bytes("MinimalForwarder: signature does not match request"));
        forwarder.execute(req, signature);
    }

    function testReplayProtection() public {
        // Create a request
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: user,
            to: address(receiver),
            value: 0,
            gas: 100000,
            nonce: 0,
            data: abi.encodeWithSignature("executeMetaTx(address,string)", user, "Hello World")
        });
        
        // Get the struct hash
        bytes32 structHash = keccak256(abi.encode(
            keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"),
            req.from,
            req.to,
            req.value,
            req.gas,
            req.nonce,
            keccak256(req.data)
        ));
        
        // Get the EIP-712 hash using the helper contract
        bytes32 digest = forwarder.getHashTypedDataV4(structHash);
        
        // Sign the digest
        uint256 userPrivateKey = 2;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Execute once - should succeed
        vm.prank(relayer);
        forwarder.execute(req, signature);
        
        // Try to execute again - should fail due to nonce increment
        vm.prank(relayer);
        vm.expectRevert(bytes("MinimalForwarder: invalid nonce"));
        forwarder.execute(req, signature);
    }
}