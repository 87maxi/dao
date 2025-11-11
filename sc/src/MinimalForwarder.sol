// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @dev Minimal forwarder compliant with EIP-2771 for gasless transactions
 */
contract MinimalForwarder {
    using ECDSA for bytes32;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
    }

    bytes32 private constant _TYPEHASH = keccak256(
        "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"
    );

    mapping(address => uint256) private _nonces;
    
    /**
     * @dev Returns the nonce for a given address
     */
    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    /**
     * @dev Validates the signature and forwards the call to the target contract
     * @param req The forward request structure
     * @param signature The signature of the request
     * @return success Whether the call succeeded
     * @return result The return data from the call
     */
    function execute(ForwardRequest calldata req, bytes calldata signature)
        external
        payable
        returns (bool success, bytes memory result)
    {
        address signer = _verify(req, signature);
        require(signer == req.from, "MinimalForwarder: signature does not match request signer");

        require(_nonces[req.from] == req.nonce, "MinimalForwarder: invalid nonce");

        _nonces[req.from]++;

        (success, result) = req.to.call{value: req.value, gas: req.gas}(req.data);
        require(success, "MinimalForwarder: call failed");
    }

    /**
     * @dev Verifies the signature of a forward request
     * @param req The forward request to verify
     * @param signature The signature to verify
     * @return signer The address of the signer
     */
    function _verify(ForwardRequest calldata req, bytes calldata signature)
        private
        view
        returns (address)
    {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _domainSeparator(),
                keccak256(_encode(req))
            )
        );

        address signer = digest.recover(signature);
        require(signer != address(0), "MinimalForwarder: invalid signature");
        return signer;
    }

    /**
     * @dev Encodes a forward request
     * @param req The request to encode
     * @return encoded The encoded request
     */
    function _encode(ForwardRequest calldata req) private pure returns (bytes memory) {
        return abi.encode(
            _TYPEHASH,
            req.from,
            req.to,
            req.value,
            req.gas,
            req.nonce,
            keccak256(req.data)
        );
    }

    /**
     * @dev Returns the domain separator for EIP-712
     * @return domainSeparator The domain separator hash
     */
    function _domainSeparator() private view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("MinimalForwarder")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
}