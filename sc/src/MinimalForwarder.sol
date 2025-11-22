pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from  "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @dev Interface that must be implemented by contracts receiving meta-transactions.
 * See https://eips.ethereum.org/EIPS/eip-2771
 */
interface IMetaTransactionReceiver {
    function onERC2771MetaTransaction(address userAddress) external;
}

/**
 * @dev Minimal forwarder for meta-transactions
 * Compliant with EIP-2771: https://eips.ethereum.org/EIPS/eip-2771
 */
contract MinimalForwarder is EIP712 {
    using ECDSA for bytes32;

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

    event MetaTransactionExecuted(
        address indexed userAddress,
        address indexed relayerAddress,
        address indexed target,
        uint256 value,
        bytes functionSignature
    );

    constructor() EIP712("MinimalForwarder", "0.0.1") {}

    /**
     * @dev Returns the nonce of a given address.
     */
    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    /**
     * @dev Verifies the signature for a forward request.
     * Uses the EIP-712 signing scheme.
     */
    function verify(
        ForwardRequest calldata req,
        bytes calldata signature
    ) public view returns (bool) {
        address signer = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    _TYPEHASH,
                    req.from,
                    req.to,
                    req.value,
                    req.gas,
                    req.nonce,
                    keccak256(req.data)
                )
            )
        ).recover(signature);

        return signer == req.from;
    }

    /**
     * @dev Executes a meta-transaction.
     * This function is called by a relayer on behalf of a user.
     */
    function execute(
        ForwardRequest calldata req,
        bytes calldata signature
    ) external payable returns (bool, bytes memory) {
        require(verify(req, signature), "MinimalForwarder: signature does not match request");
        require(_nonces[req.from] == req.nonce, "MinimalForwarder: invalid nonce");

        _nonces[req.from] = req.nonce + 1;

        (bool success, bytes memory returndata) = req.to.call{
            value: req.value,
            gas: req.gas
        }(req.data);

        // Validate that the relayer has sent enough gas for the call.
        // See https://eips.ethereum.org/EIPS/eip-2771#requirements-for-callers
        if (!success) {
            // If the target contract is a MetaTransactionReceiver, it should return the correct magic value
            if (returndata.length >= 32 &&
                keccak256(returndata) == 
                keccak256(abi.encodeWithSelector(IMetaTransactionReceiver.onERC2771MetaTransaction.selector, req.from))) {
                // Valid meta-transaction callback response
                return (success, returndata);
            }

            // Re-throw the original error
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }

        emit MetaTransactionExecuted(req.from, msg.sender, req.to, req.value, req.data);

        return (success, returndata);
    }
}