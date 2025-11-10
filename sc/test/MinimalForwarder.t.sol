// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MinimalForwarder.sol";

contract MinimalForwarderTest is Test {
    MinimalForwarder public forwarder;
    address public deployer;
    address public user1;
    address public user2;
    
    function setUp() public {
        deployer = makeAddr("deployer");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        vm.prank(deployer);
        forwarder = new MinimalForwarder();
    }

    function test_Deployment() public view {
        assertEq(forwarder.getNonce(user1), 0);
    }

    function test_VerifySignature() public {
        address from = vm.addr(1); // Known address from private key 1
        
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: from,
            to: user2,
            value: 1 ether,
            gas: 100000,
            nonce: 0,
            data: abi.encodeWithSignature("test()")
        });

        // Get the full digest including domain separator (replicate _hashTypedDataV4)
        bytes32 digest = getDigest(req);
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // This should work with the contract's verification
        assertTrue(forwarder.verify(req, signature));
    }

    function test_ExecuteSimpleRequest() public {
        TestTarget target = new TestTarget();
        address from = vm.addr(1);
        
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: from,
            to: address(target),
            value: 0,
            gas: 100000,
            nonce: 0,
            data: abi.encodeWithSignature("setValue(uint256)", 42)
        });

        bytes32 digest = getDigest(req);
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(user2);
        (bool success, ) = address(forwarder).call(
            abi.encodeWithSignature("execute((address,address,uint256,uint256,uint256,bytes),bytes)", req, signature)
        );

        assertTrue(success);
        assertEq(target.getValue(), 42);
        assertEq(forwarder.getNonce(from), 1);
    }

    // Replicate the exact hashing logic from EIP712._hashTypedDataV4
    function getDigest(MinimalForwarder.ForwardRequest memory req) internal view returns (bytes32) {
        bytes32 typeHash = keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)");
        bytes32 structHash = keccak256(abi.encode(typeHash, req.from, req.to, req.value, req.gas, req.nonce, keccak256(req.data)));
        
        // Replicate EIP712._domainSeparatorV4() logic
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
    
    function setValue(uint256 _value) external {
        value = _value;
    }
    
    function getValue() external view returns (uint256) {
        return value;
    }
}