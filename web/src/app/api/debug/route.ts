// app/api/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RPCProvider } from '@/utils/rpc';

export async function GET(request: NextRequest) {
  console.log('🔵 [DEBUG] Endpoint llamado');
  
  try {
    const rpcUrl = 'http://127.0.0.1:8545';
    const provider = new RPCProvider(rpcUrl);
    
    console.log('📡 [RPC] Probando conexión con:', rpcUrl);

    // Test múltiples métodos RPC
    const [chainId, blockNumber, gasPrice, accounts] = await Promise.all([
      provider.getChainId(),
      provider.getBlockNumber(),
      provider.getGasPrice(),
      provider.getAccounts().catch(() => []) // accounts puede fallar en algunos nodos
    ]);

    console.log('✅ [RPC] Datos obtenidos exitosamente:', {
      chainId,
      blockNumber,
      gasPrice,
      accountsCount: accounts.length
    });

    // Probar balance con una address común de testing
    const testAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    let balance = '0x0';
    
    try {
      balance = await provider.getBalance(testAddress);
      console.log('💰 [RPC] Balance obtenido:', balance);
    } catch (balanceError) {
      console.log('⚠️ [RPC] No se pudo obtener balance (normal en algunos nodos)');
    }

    // Información adicional de la red
    const [netVersion, isListening, peerCount] = await Promise.all([
      provider.netVersion().catch(() => 'unknown'),
      provider.listening().catch(() => false),
      provider.peerCount().catch(() => '0x0')
    ]);

    return NextResponse.json({
      success: true,
      rpc_url: rpcUrl,
      connection: 'successful',
      data: {
        chain_id: parseInt(chainId, 16),
        chain_id_hex: chainId,
        block_number: parseInt(blockNumber, 16),
        block_number_hex: blockNumber,
        gas_price: parseInt(gasPrice, 16),
        gas_price_hex: gasPrice,
        test_address_balance: balance,
        accounts: accounts,
        net_version: netVersion,
        listening: isListening,
        peer_count: parseInt(peerCount, 16),
        timestamp: new Date().toISOString(),
        
      }
    });

  } catch (error: any) {
    console.error('❌ [DEBUG Error]:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      rpc_url: 'http://127.0.0.1:8545',
      connection: 'failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}