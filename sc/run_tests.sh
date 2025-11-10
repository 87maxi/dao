#!/bin/bash

echo "🚀 Ejecutando tests de DAO Gasless Voting System"
echo "============================================="

# Compilar proyectos
echo "📦 Compilando contratos..."
forge build --force

# Ejecutar tests de MinimalForwarder
echo "🧪 Ejecutando tests de MinimalForwarder..."
forge test --match-contract MinimalForwarderTest -vv

# Ejecutar tests de DAOVoting  
echo "🧪 Ejecutando tests de DAOVoting..."
forge test --match-contract DAOVotingTest -vv

echo "✅ Tests completados"
echo "📊 Revisa el reporte en docs/REPORTE_DAO_GASLESS_VOTING.md"