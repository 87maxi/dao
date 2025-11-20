// app/api/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RPCProvider } from '@/utils/rpc';
import  { Env } from '@/utils/config'

export async function GET(request: NextRequest) {
  console.log('🔵 [ANVIL] Obteniendo información completa');
  
  try {
    const rpcUrl = Env.RPC_URL;
    const provider = new RPCProvider(rpcUrl);
    
    // Obtener información básica de la red
    const [chainId, blockNumber, accounts] = await Promise.all([
      provider.getChainId(),
      provider.getBlockNumber(),
      provider.getAccounts()
    ]);
    
    // Métodos específicos de Anvil
    console.log('🔄 [Anvil] Obteniendo información específica...');
    
    const [impersonatedAccounts, autoImpersonate, miningState] = await Promise.all([
      provider.sendPromise('anvil_impersonateAccount', []).catch(() => []),
      provider.sendPromise('anvil_getAutoMine', []).catch(() => null),
      provider.sendPromise('eth_mining', []).catch(() => null)
    ]);
    
    // Buscar contratos usando múltiples métodos
    console.log('🔄 [Anvil] Buscando contratos deployados...');
    
    const contractsMethod1 = await findContractsByCode(provider, accounts);
    const contractsMethod2 = await findContractsByState(provider);
    
    // Combinar y eliminar duplicados
    const allContracts = [...contractsMethod1, ...contractsMethod2];
    const uniqueContracts = allContracts.filter((contract, index, self) => 
      index === self.findIndex(c => c.address === contract.address)
    );
    
    return NextResponse.json({
      success: true,
      network: {
        chain_id: parseInt(chainId, 16),
        block_number: parseInt(blockNumber, 16),
        accounts_count: accounts.length,
        accounts: accounts.slice(0, 10) // Mostrar solo las primeras 10
      },
      anvil_specific: {
        impersonated_accounts: impersonatedAccounts,
        auto_mine: autoImpersonate,
        mining: miningState
      },
      contracts: {
        total: uniqueContracts.length,
        list: uniqueContracts
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [ANVIL Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function findContractsByCode(provider: RPCProvider, accounts: string[]) {
  const contracts = [];
  
  // Revisar todas las cuentas conocidas
  for (const address of accounts) {
    try {
      const code = await provider.getCode(address);
      if (code && code !== '0x' && code !== '0x0') {
        const balance = await provider.getBalance(address);
        contracts.push({
          address,
          balance,
          code_size: (code.length - 2) / 2,
          type: 'contract'
        });
      }
    } catch (error) {
      // Ignorar errores en cuentas individuales
    }
  }
  
  return contracts;
}

async function findContractsByState(provider: RPCProvider) {
  try {
    const state = await provider.sendPromise('anvil_dumpState', []);
    const contracts = [];
    
    if (state) {
      for (const [address, accountData] of Object.entries(state)) {
        const code = await provider.getCode(address);
        if (code && code !== '0x' && code !== '0x0') {
          contracts.push({
            address,
            code_size: (code.length - 2) / 2,
            storage_root: (accountData as any).storageRoot || 'N/A',
            type: 'state_contract'
          });
        }
      }
    }
    
    return contracts;
  } catch (error) {
    console.log('⚠️ anvil_dumpState no disponible');
    return [];
  }
}