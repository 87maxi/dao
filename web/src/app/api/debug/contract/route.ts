import { NextRequest, NextResponse } from 'next/server';
import { RPCProvider } from '@/utils/rpc';
import { Env } from '@/utils/config'
 


export async function GET(request: NextRequest) {
  try {
    const provider = new RPCProvider(Env.RPC_URL);
    
    console.log('🔍 Buscando contratos deployados...');

    // Obtener información básica
    const [chainId, blockNumber, accounts] = await Promise.all([
      provider.getChainId(),
      provider.getBlockNumber(),
      provider.getAccounts()
    ]);

    // Buscar contratos en los últimos bloques
    const contracts = await findDeployedContracts(provider);

    return NextResponse.json({
      network: {
        chain_id: parseInt(chainId, 16),
        block_number: parseInt(blockNumber, 16),
        total_accounts: accounts.length
      },
      contracts_found: contracts.length,
      contracts: contracts,
      message: contracts.length === 0 ? 
        'No hay contratos deployados. Ejecuta: npx hardhat run scripts/deploy.js --network localhost' : 
        'Contratos encontrados',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function findDeployedContracts(provider: RPCProvider) {
  const contracts = [];
  
  try {
    // Obtener el último bloque
    const latestBlockHex = await provider.getBlockNumber();
    const latestBlock = parseInt(latestBlockHex, 16);
    
    console.log(`📦 Revisando bloques recientes (hasta ${latestBlock})...`);

    // Revisar los últimos 50 bloques en busca de deployments
    for (let i = latestBlock; i > Math.max(0, latestBlock - 50); i--) {
      try {
        const block = await provider.getBlockByNumber(`0x${i.toString(16)}`, true);
        
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            // Los deployments tienen 'to' null
            if (tx.to === null) {
              try {
                const receipt = await provider.getTransactionReceipt(tx.hash);
                
                if (receipt && receipt.contractAddress) {
                  const code = await provider.getCode(receipt.contractAddress);
                  
                  if (code && code !== '0x' && code !== '0x0') {
                    console.log(`✅ Contrato encontrado: ${receipt.contractAddress}`);
                    
                    const balance = await provider.getBalance(receipt.contractAddress);
                    
                    contracts.push({
                      address: receipt.contractAddress,
                      deployer: tx.from,
                      block: i,
                      transaction: tx.hash,
                      code_size: (code.length - 2) / 2,
                      balance: balance,
                      balance_eth: (parseInt(balance, 16) / 1e18).toString()
                    });
                  }
                }
              } catch (error) {
                // Continuar con la siguiente transacción
              }
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ Error en bloque ${i}:`, error.message);
      }
    }
  } catch (error) {
    console.log('❌ Error buscando contratos:', error.message);
  }
  
  return contracts;
}