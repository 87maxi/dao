// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MinimalForwarder
 * @dev EIP-2771 compliant minimal forwarder for meta-transactions
 */
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

    // Typehash pre-calculado para la estructura ForwardRequest
    bytes32 private constant _TYPEHASH = 
        keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint256 deadline,bytes data)");

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
        
        bytes32 digest = _hashTypedDataV4(req);
        address signer = digest.recover(signature);
        return signer == req.from;
    }

    function _hashTypedDataV4(ForwardRequest calldata req) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                _DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        _TYPEHASH,
                        req.from,
                        req.to,
                        req.value,
                        req.gas,
                        req.nonce,
                        req.deadline,
                        keccak256(req.data)
                    )
                )
            )
        );
    }
    
    /**
     * @dev Returns the domain separator for EIP-712
     */
    function domainSeparator() external view returns (bytes32) {
        return _DOMAIN_SEPARATOR;
    }
}