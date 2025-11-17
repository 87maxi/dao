#!/bin/bash
# Script para generar todos los ABIs

echo "Generando ABIs..."
mkdir -p abis

# Generar ABI para DAOVoting
forge inspect src/DAOVoting.sol:DAOVoting abi  --json > abis/DAOVoting.json
echo "✓ DAOVoting ABI generado"

# Generar ABI para MinimalForwarder  
forge inspect src/MinimalForwarder.sol:MinimalForwarder abi --json > abis/MinimalForwarder.json
echo "✓ MinimalForwarder ABI generado"

echo "ABIs guardados en carpeta 'abis/'"