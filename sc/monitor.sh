#!/bin/bash

set -e

CONTRACT_ADDRESS=$1  #$(cat .env | grep DAO_ADDRESS | cut -d '=' -f2)
RPC_URL="http://localhost:8545"

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "Error: No se encontró DAO_ADDRESS en .env"
    exit 1
fi

echo "🚀 Iniciando monitoreo del contrato DAO: $CONTRACT_ADDRESS"
echo "📡 Conectado a: $RPC_URL"
echo "Presiona Ctrl+C para detener"

# Función para limpiar al salir
cleanup() {
    echo ""
    echo "🛑 Monitoreo detenido"
    exit 0
}

trap cleanup INT

while true; do
    echo ""
    echo "=== $(date) ==="
    
    # Ver balance del contrato
    BALANCE=$(cast balance $CONTRACT_ADDRESS --rpc-url $RPC_URL)
    echo "💰 Balance del contrato: $BALANCE wei"
    
    # Ver transacciones recientes
    LATEST_BLOCK=$(cast block-number --rpc-url $RPC_URL)
    echo "📦 Buscando en bloque: $LATEST_BLOCK"
    
    # Buscar transacciones en los últimos 5 bloques
    for BLOCK in $(seq $(($LATEST_BLOCK - 5)) $LATEST_BLOCK); do
        cast block $BLOCK --rpc-url $RPC_URL --json 2>/dev/null | \
        jq -r '.transactions[]?' | \
        while read TX_HASH; do
            TX_DATA=$(cast tx $TX_HASH --rpc-url $RPC_URL --json 2>/dev/null)
            if [ $? -eq 0 ]; then
                TO_ADDRESS=$(echo $TX_DATA | jq -r '.to')
                if [ "$TO_ADDRESS" = "$CONTRACT_ADDRESS" ]; then
                    echo "🎯 TX para DAO: $TX_HASH"
                    echo "   From: $(echo $TX_DATA | jq -r '.from')"
                    echo "   Value: $(echo $TX_DATA | jq -r '.value') wei"
                fi
            fi
        done
    done
    
    sleep 10
done