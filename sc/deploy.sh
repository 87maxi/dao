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



# Check if the deployment script exists
if [ ! -f "script/DeployScript.s.sol" ]; then
    echo_error "Deployment script script/DeployScript.s.sol not found"
    exit 1
fi

# Display configuration
echo "Deploying to network: $RPC_URL"

echo "Starting deployment using Foundry script..."
echo "" >&2  # Empty line for readability

# Run the Foundry deployment script
if forge script script/DeployScript.s.sol:DeployScript --rpc-url "$RPC_URL" --broadcast --private-key "$PRIVATE_KEY" --slow --json; then
    echo "" >&2  # Empty line for readability
    echo_success "✓ Deployment completed successfully!"
    
    # Extract addresses from the broadcast output
    if [ -f "broadcast/DeployScript.s.sol/31337/run-latest.json" ]; then
        echo "Processing deployment results..."
        
        # Extract contract addresses (this is a simplified approach)
        FORWARDER_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "MinimalForwarder") | .contractAddress' broadcast/DeployScript.s.sol/31337/run-latest.json 2>/dev/null || echo "")
        DAO_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "DAOVoting") | .contractAddress' broadcast/DeployScript.s.sol/31337/run-latest.json 2>/dev/null || echo "")
        
        if [ -n "$FORWARDER_ADDRESS" ] && [ -n "$DAO_ADDRESS" ]; then
            cat > .env << EOF
# Deployment addresses - $(date)
FORWARDER_ADDRESS=$FORWARDER_ADDRESS
DAO_ADDRESS=$DAO_ADDRESS
RPC_URL=$RPC_URL
EOF
            echo_success "Deployment addresses saved to .env file"
        else
            echo_warning "Could not extract contract addresses from deployment output"
        fi
    fi
else
    echo_error "Deployment failed!"
    exit 1
fi
forge inspect src/MinimalForwarder.sol:MinimalForwarder  abi --json > ../web/src/contracts/abis/MinimalForwarder.json;
forge inspect src/DAOVoting.sol:DAOVoting  abi --json > ../web/src/contracts/abis/DAOVoting.json;
