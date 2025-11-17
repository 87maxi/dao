// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MinimalForwarder {
    using ECDSA for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        uint256 deadline;
        bytes data;
    }

    // Typehash pre-calculado para "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint256 deadline,bytes data)"
    bytes32 private constant _TYPEHASH = 0x8560d11400000000000000000000000000000000000000000000000000000000;

    bytes32 private immutable _DOMAIN_SEPARATOR;
    mapping(address => uint256) private _nonces;
    
    constructor() {
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("MinimalForwarder")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function execute(ForwardRequest calldata req, bytes calldata signature)
        external
        payable
        returns (bool, bytes memory)
    {
        require(verify(req, signature), "MinimalForwarder: invalid signature");
        require(_nonces[req.from] == req.nonce, "MinimalForwarder: invalid nonce");
        require(block.timestamp <= req.deadline, "MinimalForwarder: request expired");

        _nonces[req.from]++;

        (bool success, bytes memory returndata) = req.to.call{value: req.value, gas: req.gas}(
            abi.encodePacked(req.data, req.from)
        );

        require(success, "MinimalForwarder: call failed");
        return (success, returndata);
    }

    function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool) {
        if (_nonces[req.from] != req.nonce) return false;
        if (block.timestamp > req.deadline) return false;
        
        bytes32 digest = _getDigest(req);
        address signer = digest.recover(signature);
        return signer == req.from;
    }

    function _getDigest(ForwardRequest calldata req) private view returns (bytes32 digest) {
        assembly {
            let ptr := mload(0x40)
            
            // Calcular hash de req.data
            let dataHash
            let dataPtr := add(req, 0xc0) // offset para req.data en calldata
            let dataLength := calldataload(dataPtr)
            dataPtr := add(dataPtr, 0x20)
            
            if gt(dataLength, 0) {
                dataHash := keccak256(dataPtr, dataLength)
            } {
                // Hash de bytes vacíos
                dataHash := 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
            }
            
            // Calcular structHash
            mstore(ptr, _TYPEHASH)
            mstore(add(ptr, 32), calldataload(add(req, 0x20)))  // from
            mstore(add(ptr, 64), calldataload(add(req, 0x40)))  // to
            mstore(add(ptr, 96), calldataload(add(req, 0x60)))  // value
            mstore(add(ptr, 128), calldataload(add(req, 0x80))) // gas
            mstore(add(ptr, 160), calldataload(add(req, 0xa0))) // nonce
            mstore(add(ptr, 192), calldataload(add(req, 0xc0))) // deadline (antes de data)
            mstore(add(ptr, 224), dataHash)                     // data hash
            
            let structHash := keccak256(ptr, 256)
            
            // Calcular digest EIP-712
            mstore(ptr, 0x1901000000000000000000000000000000000000000000000000000000000000)
            
            // Cargar _DOMAIN_SEPARATOR desde storage (slot 0)
            mstore(add(ptr, 2), sload(0))
            mstore(add(ptr, 34), structHash)
            
            digest := keccak256(ptr, 66)
            mstore(0x40, add(ptr, 322))
        }
    }
}