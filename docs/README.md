# DAO Web3 Application

This is a decentralized autonomous organization (DAO) application built with Next.js 16, viem, wagmi, and Tailwind CSS.

## Features

- **Wallet Connection**: Connect MetaMask wallet for authentication
- **Funding Panel**: Deposit ETH to DAO and view balances
- **Proposal Creation**: Create new funding proposals
- **Proposal List**: View active proposals and vote
- **Gasless Voting**: Vote using meta-transactions signed off-chain
- **Responsive Design**: Mobile and desktop compatible UI

## Development Setup

1. Clone the repository
2. Navigate to the web directory: `cd web`
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file in the web directory with:

```bash
NEXT_PUBLIC_DAO_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
NEXT_PUBLIC_FORWARDER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
NEXT_PUBLIC_CHAIN_ID=31337
RELAYER_PRIVATE_KEY=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
RELAYER_ADDRESS=0x90F79bf6EB2c4f870365E785982E1f101E93b906
RPC_URL=http://127.0.0.1:8545
```

## Directory Structure

```
/web
  /src
    /app
      /api
        /relay
          route.ts
      layout.tsx
      page.tsx
    /components
      ConnectWallet.tsx
      FundingPanel.tsx
      Header.tsx
      ProposalCard.tsx
      ProposalList.tsx
    /hooks
      useBalance.ts
      useMetaTransactions.ts
    /lib
      viem.ts
      wagmi.ts
    /styles
      globals.css
```

## External Services

- **Relayer Service**: `/api/relay` handles meta-transactions and forwards them to the MinimalForwarder contract
- **Anvil Development Network**: Application is configured for local development using Anvil

## Smart Contracts

The application interacts with a DAO contract supporting:
- Proposal creation
- Voting with delegation
- Gasless transactions via EIP-712 signatures
- Fund management

Contracts are expected to be deployed to localhost:31337 for development.

Generated with [Continue](https://continue.dev)

Co-Authored-By: Continue <noreply@continue.dev>