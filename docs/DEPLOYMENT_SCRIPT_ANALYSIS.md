# Análisis del Script de Despliegue con Foundry

## Contexto

El proyecto actualmente tiene dos métodos de despliegue:

1. Un script bash (`sc/deploy.sh`)
2. Un script de Solidity con Foundry (`sc/script/DeployScript.s.sol`)

## Recomendación

Se recomienda usar el script de Solidity `DeployScript.s.sol` porque:

- Es más integrado con el ecosistema de Foundry
- Es más confiable y consistente
- Permite mejor testing y verificación
- Es más fácil de mantener y extender
- Utiliza las mejores prácticas de Foundry

## Uso del Script de Despliegue

Para desplegar los contratos usando el script de Solidity:

```bash
# Asegúrate de tener una clave privada en una variable de entorno
export PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Despliega en localhost
forge script sc/script/DeployScript.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast --private-key $PRIVATE_KEY

# Despliega en una red como Sepolia
forge script sc/script/DeployScript.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --private-key $PRIVATE_KEY --etherscan-api-key $ETHERSCAN_API_KEY --verify
```

## Automatización (Opcional)

Si necesitas un script bash para automatizar despliegues, se puede crear uno más simple que envuelva el comando de forge:

```bash
#!/bin/bash
# sc/deploy.sh

PRIVATE_KEY="${PRIVATE_KEY:-ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
RPC_URL="${RPC_URL:-http://localhost:8545}"

forge script sc/script/DeployScript.s.sol:DeployScript \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --private-key "$PRIVATE_KEY" \
    --slow \
    --json
```

## Resultados del Despliegue

Los resultados se guardan automáticamente en:
- `broadcast/`: Transacciones y eventos
- `.env`: Direcciones (si se modifica el script para generarlo)

Los scripts de Foundry manejan automáticamente la verificación, almacenamiento de resultados y otras tareas.