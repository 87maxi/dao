import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
// import { localhost } from 'viem/chains';

// Custom Anvil chain definition to ensure correct chainId
const anvil = {
  id: 31337,
  name: "Anvil",
  network: "anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"],
    },
  },
  testnet: true,
};
import { verifyTypedData } from "viem";

// Relayer account (pays gas for users)
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;

if (!RELAYER_PRIVATE_KEY) {
  console.error("RELAYER_PRIVATE_KEY not configured");
}

const account = RELAYER_PRIVATE_KEY
  ? privateKeyToAccount(RELAYER_PRIVATE_KEY)
  : null;

// Clients for blockchain interaction
const publicClient = createPublicClient({
  chain: anvil,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545"),
});

const walletClient = account
  ? createWalletClient({
      account,
      chain: anvil,
      transport: http(
        process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545",
      ),
    })
  : null;

// EIP-712 Domain (must match frontend)
const domain = {
  name: "DAOVoting",
  version: "1",
  chainId: 31337,
  verifyingContract: process.env.NEXT_PUBLIC_DAO_ADDRESS as `0x${string}`,
};

const types = {
  Vote: [
    { name: "proposalId", type: "uint256" },
    { name: "support", type: "uint8" },
  ],
} as const;

// ABI for castVote function
const daoAbi = parseAbi([
  "function castVote(uint256 proposalId, uint8 vote) external",
]);

export async function POST(request: NextRequest) {
  try {
    // Check if relayer is configured
    if (!walletClient || !account) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Relayer not configured. Please set RELAYER_PRIVATE_KEY in environment variables.",
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { request: voteRequest, signature, chainId } = body;

    console.log("Relayer received vote request:", {
      from: voteRequest.from,
      proposalId: voteRequest.nonce,
      chainId,
    });

    // Validate required fields
    if (!voteRequest || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: request and signature",
        },
        { status: 400 },
      );
    }

    // Extract vote data from the encoded function call
    // The data field contains the encoded castVote call
    const proposalIdFromData = BigInt("0x" + voteRequest.data.slice(10, 74));
    const supportFromData = parseInt(voteRequest.data.slice(74, 138), 16);

    // Prepare message for signature verification
    const message = {
      proposalId: proposalIdFromData,
      support: supportFromData as 1 | 2 | 3,
    };

    console.log("Verifying signature for vote:", message);

    // Verify EIP-712 signature
    const isValid = await verifyTypedData({
      address: voteRequest.from as `0x${string}`,
      domain,
      types,
      primaryType: "Vote",
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      console.error("Invalid signature");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 },
      );
    }

    console.log("Signature valid, executing transaction...");

    // Execute the vote transaction (relayer pays gas)
    // walletClient already has account and chain configured
    const hash = await walletClient.writeContract({
      address: process.env.NEXT_PUBLIC_DAO_ADDRESS as `0x${string}`,
      abi: daoAbi,
      functionName: "castVote",
      args: [proposalIdFromData, message.support],
      chain: anvil,
    } as any);

    console.log("Vote executed successfully:", hash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (error: any) {
    console.error("Relayer error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process vote",
        details: error.shortMessage || error.toString(),
      },
      { status: 500 },
    );
  }
}

// Health check endpoint
export async function GET() {
  const isConfigured = !!RELAYER_PRIVATE_KEY && !!walletClient;

  return NextResponse.json({
    status: isConfigured ? "ready" : "not_configured",
    relayerAddress: account?.address || null,
    daoAddress: process.env.NEXT_PUBLIC_DAO_ADDRESS,
    message: isConfigured
      ? "Relayer is ready to process gasless transactions"
      : "Relayer not configured. Set RELAYER_PRIVATE_KEY environment variable.",
  });
}
