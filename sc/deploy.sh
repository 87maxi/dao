#!/bin/bash

set -e

echo "🚀 Deployando DAO en Anvil..."

# Verificar Anvil
if ! curl -s http://127.0.0.1:8545 > /dev/null; then
    echo "❌ Anvil no está ejecutándose. Iniciando..."
    anvil &
    sleep 3
fi

# Limpiar y compilar
echo "🧹 Limpiando build anterior..."
forge clean

echo "📦 Compilando..."
forge build

# Configurar variable de entorno
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

echo "🔑 Usando private key de Anvil por defecto"
echo "📝 Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Deploy
forge script script/DeployScript.s.sol:DeployScript \
    --rpc-url http://127.0.0.1:8545 \
    --private-key $PRIVATE_KEY \
    --broadcast \
    -vv

echo "✅ ¡Deployment completado!"