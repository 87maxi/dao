#!/bin/bash

# A generic script to execute a sequence of transactions defined in a JSON fixture.
# This script reads a fixture file and uses `cast send` to execute each transaction.

# --- Configuration ---
RPC_URL="http://127.0.0.1:8545"
# The fixture file path is relative to the script's location
FIXTURE_FILE="$(dirname "$0")/fixture/01_transaction_sequence.json"

PROPOSER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80


# --- Pre-flight Checks ---

if ! command -v jq &> /dev/null; then
    echo "Error: 'jq' is not installed." >&2
    exit 1
fi
if ! command -v cast &> /dev/null; then
    echo "Error: 'cast' (from Foundry) is not in your PATH." >&2
    exit 1
fi
if [ -z "$1" ]; then
    echo "Usage: $0 <DAO_CONTRACT_ADDRESS>" >&2
    echo "Please also set the PROPOSER_PRIVATE_KEY environment variable." >&2
    exit 1
fi
if [ -z "$PROPOSER_PRIVATE_KEY" ]; then
    echo "Error: PROPOSER_PRIVATE_KEY environment variable is not set." >&2
    exit 1
fi

DAO_ADDRESS=$1

echo "--- Starting Fixture Execution Engine ---"
echo "DAO Contract: $DAO_ADDRESS"
echo "Fixture File: $FIXTURE_FILE"
echo "-----------------------------------------"
echo ""

if [ ! -f "$FIXTURE_FILE" ]; then
    echo "Error: Fixture file not found at $FIXTURE_FILE" >&2
    exit 1
fi

tx_count=$(jq 'length' "$FIXTURE_FILE")

# Loop through each transaction defined in the fixture
for i in $(seq 0 $(($tx_count - 1))); do
    tx_details=$(jq ".[$i]" "$FIXTURE_FILE")
    description=$(echo "$tx_details" | jq -r ".description")

    echo "Executing Tx $(($i + 1)) of $tx_count: \"$description\""

    # --- Build the `cast send` command dynamically ---
    command_base="cast send \"$DAO_ADDRESS\""

    # Check for a value transfer
    value=$(echo "$tx_details" | jq -r ".value // \"\"")
    if [ -n "$value" ]; then
        command_base="$command_base --value $value"
    fi

    # Check for a function call
    func_sig=$(echo "$tx_details" | jq -r ".function // \"\"")
    if [ -n "$func_sig" ]; then
        # Format arguments into a space-separated, shell-safe string
        args_string=$(echo "$tx_details" | jq -r '.args | @sh')
        command_base="$command_base \"$func_sig\" $args_string"
    fi

    # --- Resolve the signer's private key ---
    signer_pk_placeholder=$(echo "$tx_details" | jq -r ".signerPrivateKey")
    signer_pk=""
    if [ "$signer_pk_placeholder" == "YOUR_PROPOSER_PRIVATE_KEY" ]; then
        signer_pk="$PROPOSER_PRIVATE_KEY"
    else
        signer_pk="$signer_pk_placeholder"
    fi
    if [ -z "$signer_pk" ] || [ "$signer_pk" == "null" ]; then
        echo "  -> Error: No private key was resolved for this transaction. Halting." >&2
        exit 1
    fi

    # --- Finalize and execute the command ---
    final_command="$command_base --private-key \"$signer_pk\" --rpc-url \"$RPC_URL\" --json"
    echo $final_command;
    response=$(eval $final_command)

    if [ $? -ne 0 ]; then
        echo "  -> Error: 'cast send' failed. Halting script." >&2
        exit 1
    fi

    tx_hash=$(echo "$response" | jq -r '.transactionHash')
    if [ -n "$tx_hash" ] && [ "$tx_hash" != "null" ]; then
        echo "  -> Success! Transaction Hash: $tx_hash"
    else
        echo "  -> Error: Could not parse transaction hash from 'cast' response."
        echo "  -> Raw Response: $response"
    fi
    echo ""
done

echo "--- Fixture Execution Complete ---"
