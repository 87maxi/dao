---
name: projecto-dao
description: utilizar esta descripcion para realizar el projecto
invokable: true
---


## Smart Contracts


## Main DAO contract with:
   **DAOVoting.sol** 
   - Proposal creation (requires 10% of DAO balance)
   - Voting system (FOR, AGAINST, ABSTAIN)
   - Vote tracking and statistics
   - Automatic execution after approval + delay
   - **ERC2771** integration for gasless transactions



## EIP-2771 compliant forwarder:
   **MinimalForwarder.sol**
   - Usa  **EIP-2771** standard; be rigorous in adhering to the standard.
   - Validates meta-transaction signatures
   - Forwards calls to target contracts
   - Nonce tracking for replay protection

# Key Concepts
## Gasless Voting (Meta-Transactions)

   - User signs vote off-chain (no gas needed)
   - Web app (relayer) submits to MinimalForwarder
   - MinimalForwarder validates and forwards to DAO contract
   - DAO contract extracts original sender via **ERC2771**
