import { NextRequest, NextResponse } from 'next/server';
import { RPCProvider } from '@/utils/rpc';
import { Env } from '@/utils/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type') || 'overview';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const provider = new RPCProvider(Env.RPC_URL);
    
    switch (dataType) {
      case 'overview':
        return await getBlockchainOverview(provider);
      case 'blocks':
        return await getRecentBlocks(provider, limit);
      case 'transactions':
        return await getRecentTransactions(provider, limit);
      case 'accounts':
        return await getAccountsData(provider, limit);
      case 'contracts':
        return await getContractsData(provider, limit);
      case 'storage':
        const address = searchParams.get('address');
        if (!address) return NextResponse.json({ error: 'Se requiere address para storage' }, { status: 400 });
        return await getStorageData(provider, address, limit);
      default:
        return NextResponse.json({ error: 'Tipo de datos no válido' }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getBlockchainOverview(provider: RPCProvider) {
  const [chainId, blockNumber, gasPrice, accounts] = await Promise.all([
    provider.getChainId(),
    provider.getBlockNumber(),
    provider.getGasPrice(),
    provider.getAccounts()
  ]);

  // Obtener el último bloque con detalles
  const latestBlock = await provider.getBlockByNumber('latest', false);
  
  // Obtener balances de las primeras cuentas
  const accountBalances = [];
  for (const account of accounts.slice(0, 5)) {
    const balance = await provider.getBalance(account);
    accountBalances.push({
      address: account,
      balance: balance,
      balance_eth: (parseInt(balance, 16) / 1e18).toString()
    });
  }

  return NextResponse.json({
    network: {
      chain_id: parseInt(chainId, 16),
      chain_name: getChainName(parseInt(chainId, 16)),
      block_number: parseInt(blockNumber, 16),
      gas_price: parseInt(gasPrice, 16),
      gas_price_gwei: (parseInt(gasPrice, 16) / 1e9).toFixed(2)
    },
    latest_block: {
      number: parseInt(latestBlock.number, 16),
      hash: latestBlock.hash,
      timestamp: parseInt(latestBlock.timestamp, 16),
      transaction_count: latestBlock.transactions?.length || 0,
      miner: latestBlock.miner,
      difficulty: parseInt(latestBlock.difficulty, 16)
    },
    accounts: {
      total: accounts.length,
      sample: accountBalances
    },
    timestamp: new Date().toISOString()
  });
}

async function getRecentBlocks(provider: RPCProvider, limit: number) {
  const latestBlockHex = await provider.getBlockNumber();
  const latestBlock = parseInt(latestBlockHex, 16);
  
  const blocks = [];
  
  for (let i = latestBlock; i > Math.max(0, latestBlock - limit); i--) {
    try {
      const block = await provider.getBlockByNumber(`0x${i.toString(16)}`, true);
      if (block) {
        blocks.push({
          number: parseInt(block.number, 16),
          hash: block.hash,
          timestamp: parseInt(block.timestamp, 16),
          date: new Date(parseInt(block.timestamp, 16) * 1000).toISOString(),
          miner: block.miner,
          transaction_count: block.transactions?.length || 0,
          gas_used: parseInt(block.gasUsed, 16),
          gas_limit: parseInt(block.gasLimit, 16),
          base_fee_per_gas: block.baseFeePerGas ? parseInt(block.baseFeePerGas, 16) : null,
          transactions: block.transactions?.slice(0, 5) || []
        });
      }
    } catch (error) {
      console.log(`Error obteniendo bloque ${i}:`, error);
    }
  }
  
  return NextResponse.json({
    blocks: blocks,
    total_blocks: blocks.length,
    from_block: latestBlock,
    to_block: Math.max(0, latestBlock - limit)
  });
}

async function getRecentTransactions(provider: RPCProvider, limit: number) {
  const latestBlockHex = await provider.getBlockNumber();
  const latestBlock = parseInt(latestBlockHex, 16);
  
  const transactions = [];
  let blocksProcessed = 0;
  
  for (let i = latestBlock; i >= 0 && transactions.length < limit && blocksProcessed < 50; i--) {
    try {
      const block = await provider.getBlockByNumber(`0x${i.toString(16)}`, true);
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (transactions.length >= limit) break;
          
          try {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            transactions.push({
              hash: tx.hash,
              block_number: parseInt(block.number, 16),
              from: tx.from,
              to: tx.to,
              value: tx.value,
              value_eth: (parseInt(tx.value, 16) / 1e18).toString(),
              gas: parseInt(tx.gas, 16),
              gas_price: parseInt(tx.gasPrice, 16),
              input: tx.input,
              input_length: tx.input.length,
              is_contract_creation: tx.to === null,
              contract_address: receipt?.contractAddress,
              status: receipt?.status ? parseInt(receipt.status, 16) === 1 : null,
              gas_used: receipt?.gasUsed ? parseInt(receipt.gasUsed, 16) : null
            });
          } catch (error) {
            // Continuar con la siguiente transacción
          }
        }
        blocksProcessed++;
      }
    } catch (error) {
      console.log(`Error procesando bloque ${i}:`, error);
    }
  }
  
  return NextResponse.json({
    transactions: transactions,
    total_transactions: transactions.length,
    blocks_searched: blocksProcessed
  });
}

async function getAccountsData(provider: RPCProvider, limit: number) {
  const accounts = await provider.getAccounts();
  
  const accountsData = [];
  for (const account of accounts.slice(0, limit)) {
    const [balance, transactionCount, code] = await Promise.all([
      provider.getBalance(account),
      provider.getTransactionCount(account),
      provider.getCode(account)
    ]);
    
    accountsData.push({
      address: account,
      balance: balance,
      balance_eth: (parseInt(balance, 16) / 1e18).toString(),
      transaction_count: parseInt(transactionCount, 16),
      is_contract: code !== '0x' && code !== '0x0',
      code_size: code !== '0x' ? (code.length - 2) / 2 : 0
    });
  }
  
  return NextResponse.json({
    accounts: accountsData,
    total_accounts: accounts.length,
    sample_size: accountsData.length
  });
}

async function getContractsData(provider: RPCProvider, limit: number) {
  const accounts = await provider.getAccounts();
  const contracts = [];
  
  for (const account of accounts.slice(0, limit)) {
    const code = await provider.getCode(account);
    if (code !== '0x' && code !== '0x0') {
      const [balance, transactionCount] = await Promise.all([
        provider.getBalance(account),
        provider.getTransactionCount(account)
      ]);
      
      contracts.push({
        address: account,
        code_size: (code.length - 2) / 2,
        balance: balance,
        balance_eth: (parseInt(balance, 16) / 1e18).toString(),
        transaction_count: parseInt(transactionCount, 16),
        bytecode_preview: code.substring(0, 100) + '...'
      });
    }
  }
  
  return NextResponse.json({
    contracts: contracts,
    total_contracts: contracts.length
  });
}

async function getStorageData(provider: RPCProvider, address: string, limit: number) {
  const storageSlots = [];
  
  // Leer los primeros slots de storage
  for (let i = 0; i < limit; i++) {
    try {
      const storage = await provider.getStorageAt(address, `0x${i.toString(16)}`);
      storageSlots.push({
        slot: `0x${i.toString(16)}`,
        value: storage,
        value_decimal: parseInt(storage, 16).toString()
      });
    } catch (error) {
      storageSlots.push({
        slot: `0x${i.toString(16)}`,
        error: 'Error reading storage slot'
      });
    }
  }
  
  // Verificar si es un contrato
  const code = await provider.getCode(address);
  
  return NextResponse.json({
    address: address,
    is_contract: code !== '0x' && code !== '0x0',
    storage_slots: storageSlots,
    total_slots_read: storageSlots.length
  });
}

function getChainName(chainId: number): string {
  const chains: { [key: number]: string } = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    31337: 'Hardhat/Anvil Local',
    1337: 'Ganache Local'
  };
  return chains[chainId] || `Unknown Chain (${chainId})`;
}