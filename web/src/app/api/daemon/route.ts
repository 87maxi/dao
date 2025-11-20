import { NextRequest, NextResponse } from 'next/server';
import { RPCProvider } from '@/utils/rpc';
import { Env } from '@/utils/config'



/**
 * Daemon endpoint to check and execute approved proposals
 * This should be called periodically (e.g., via cron job or interval)
 */
export async function GET(request: NextRequest) {
  console.log('🔵 [DEBUG] Obteniendo contratos deployados en Anvil');
  
  try {
    const rpcUrl  =  Env.RPC_URL;
    const provider = new RPCProvider( rpcUrl);
    
    // Método específico de Anvil para obtener el estado
    console.log('🔄 [Anvil] Obteniendo estado completo...');
    const state = await provider.sendPromise('anvil_dumpState', []);

    console.log('📋 [Anvil] Estado obtenido, procesando...');
    
    // El estado contiene información sobre todas las cuentas y contratos
    const contracts = await extractContractsFromState(provider, state);
    
    return NextResponse.json({
      success: true,
      contracts_count: contracts.length,
      contracts: contracts,
      raw_state_sample: state ? Object.keys(state).slice(0, 3) : 'No state available',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [DEBUG Error]:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      suggestion: 'Asegúrate de que Anvil esté corriendo y tenga contratos deployados',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function extractContractsFromState(provider: RPCProvider, state: any) {
  const contracts: any[] = [];
  
  if (!state) return contracts;
  
  // Iterar sobre todas las direcciones en el estado
  for (const [address, accountData] of Object.entries(state)) {
    try {
      // Verificar si tiene código (es un contrato)
      const code = await provider.getCode(address);
      
      if (code && code !== '0x' && code !== '0x0') {
        // Obtener más información del contrato
        const balance = await provider.getBalance(address);
        const transactionCount = await provider.getTransactionCount(address);
        
        contracts.push({
          address: address,
          balance: balance,
          balance_eth: parseInt(balance, 16) / 1e18,
          code_size: (code.length - 2) / 2, // Tamaño en bytes
          transaction_count: parseInt(transactionCount, 16),
          is_contract: true,
          storage_root: (accountData as any).storageRoot || 'N/A'
        });
      }
    } catch (error) {
      console.log(`⚠️ Error procesando address ${address}:`, error);
    }
  }
  
  return contracts;
}