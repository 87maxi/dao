#!/bin/bash
set -euo pipefail
# Simplified deployment script that wraps the Foundry deployment script

# Default values
export PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
RPC_URL="${RPC_URL:-http://localhost:8545}"

# Color output for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd ${PWD};

# Function to print colored output
echo_error() {
    echo -e "${RED}Error: $1${NC}" >&2
}

echo_success() {
    echo -e "${GREEN}$1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}Warning: $1${NC}"
}

# Check if forge is installed
if ! command -v forge &> /dev/null; then
    echo_error "forge is not installed. Please install Foundry first."
    exit 1
fi


ls -l ./sc/script/DeployScript.s.sol


# Check if the deployment script exists
if [ ! -f "./sc/script/DeployScript.s.sol" ]; then
    echo_error "Deployment script ./sc/script/DeployScript.s.sol not found"
    exit 1
fi

# Display configuration
echo "Deploying to network: $RPC_URL"

echo "Starting deployment using Foundry script..."
echo "" >&2  # Empty line for readability



# Run the Foundry deployment script
(cd ./sc && forge script ./script/DeployScript.s.sol:DeployScript --rpc-url "$RPC_URL" --broadcast --private-key "$PRIVATE_KEY" --slow --json);






        # Extract contract addresses (this is a simplified approach)
FORWARDER_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "MinimalForwarder") | .contractAddress' ./sc/broadcast/DeployScript.s.sol/31337/run-latest.json 2>/dev/null || echo "")
DAO_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "DAOVoting") | .contractAddress' ./sc/broadcast/DeployScript.s.sol/31337/run-latest.json 2>/dev/null || echo "")


TOKEN_ADDRESS="test_token_address"





cat >  ./web/.env << EOF
# Deployment addresses - $(date)
# Ethereum Network Configuration
NEXT_PUBLIC_RPC_URL=$RPC_URL
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=Anvil Local
NEXT_PUBLIC_HEX_CHAIN_ID=0x7a69

# Contract Addresses (Update these after deployment)
NEXT_PUBLIC_DAO_ADDRESS=$DAO_ADDRESS
NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS=$FORWARDER_ADDRESS
NEXT_PUBLIC_TOKEN_ADDRESS=$TOKEN_ADDRESS

# Development Flags
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_DEBUG_MODE=true
MODE_ENV=test
RELAYER_PRIVATE_KEY=0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
EOF


cat ./web/.env > ./web/.env.local


echo "Generating ABI files... minimal forwarder"
MINIMALFORWARDER=$(cd  ./sc/  && forge inspect ./src/MinimalForwarder.sol:MinimalForwarder  abi --json > ../web/src/contracts/abis/MinimalForwarder.json)
echo "Generating ABI files... DAO voting"
DAOVOTING=$( cd sc/ && forge inspect  ./src/DAOVoting.sol:DAOVoting  abi --json > ../web/src/contracts/abis/DAOVoting.json)
