import { NextRequest, NextResponse } from 'next/server';
import { RPCProvider } from '@/utils/rpc';
import  { Env } from '@/utils/config'


export async function GET(request: NextRequest) {
  try {
    const provider = new RPCProvider(Env.RPC_URL);
    
    // Información básica de la red
    const [chainId, blockNumber, accounts] = await Promise.all([
      provider.getChainId(),
      provider.getBlockNumber(),
      provider.getAccounts()
    ]);

    // Buscar contratos en las cuentas
    const contracts = [];
    for (const address of accounts) {
      const code = await provider.getCode(address);
      if (code && code !== '0x' && code !== '0x0') {
        const balance = await provider.getBalance(address);
        contracts.push({
          address: address,
          code_size: (code.length - 2) / 2,
          balance: balance,
          balance_eth: (parseInt(balance, 16) / 1e18).toString(),
          is_contract: true
        });
      }
    }

    // Respuesta JSON simple
    return NextResponse.json({
      chain_id: parseInt(chainId, 16),
      block_number: parseInt(blockNumber, 16),
      total_contracts: contracts.length,
      contracts: contracts,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}