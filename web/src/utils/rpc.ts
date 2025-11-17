import { RPCRequest, RPCResponse, RPCCallback, IRPCProvider } from './types/rpc';

export class RPCProvider implements IRPCProvider {
  private rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  // Método principal para enviar requests RPC
   send = (method: string, params: any[] = [], callback: RPCCallback): void => {
    const request: RPCRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params: params.length > 0 ? params : undefined
    };

    fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(request)
    })
    .then(async (response: Response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    })
    .then((data: RPCResponse) => {
      if (data.error) {
        callback(new Error(`RPC Error: ${data.error.message} (code: ${data.error.code})`));
      } else {
        callback(null, data.result);
      }
    })
    .catch((error: Error) => {
      callback(new Error(`Network error: ${error.message}`));
    });
  }

  // ========== MÉTODOS ETHEREUM ==========

  getBlockNumber = (callback: RPCCallback): void => {
    this.send('eth_blockNumber', [], (error, result) => {
      if (error) return callback(error);
      callback(null, result);
    });
  }

  getBalance = (address: string, callback: RPCCallback, block: string = 'latest'): void => {
    this.send('eth_getBalance', [address, block], callback);
  }

  getChainId = (callback: RPCCallback): void => {
    this.send('eth_chainId', [], (error, result) => {
      if (error) return callback(error);
      callback(null, result);
    });
  }

  getGasPrice = (callback: RPCCallback): void => {
    this.send('eth_gasPrice', [], callback);
  }

  getTransactionCount = (address: string, callback: RPCCallback, block: string = 'latest'): void => {
    this.send('eth_getTransactionCount', [address, block], callback);
  }

  getCode = (address: string, callback: RPCCallback, block: string = 'latest'): void => {
    this.send('eth_getCode', [address, block], callback);
  }

  getStorageAt = (address: string, position: string, callback: RPCCallback, block: string = 'latest'): void => {
    this.send('eth_getStorageAt', [address, position, block], callback);
  }

  // ========== MÉTODOS DE TRANSACCIONES ==========

  call = (transaction: any, callback: RPCCallback, block: string = 'latest'): void => {
    this.send('eth_call', [transaction, block], callback);
  }

  estimateGas = (transaction: any, callback: RPCCallback): void => {
    this.send('eth_estimateGas', [transaction], callback);
  }

  sendRawTransaction = (signedTransaction: string, callback: RPCCallback): void => {
    this.send('eth_sendRawTransaction', [signedTransaction], callback);
  }

  getTransactionReceipt = (transactionHash: string, callback: RPCCallback): void => {
    this.send('eth_getTransactionReceipt', [transactionHash], callback);
  }

  // ========== MÉTODOS DE BLOQUES ==========

  getBlockByNumber = (blockNumber: string, includeTransactions: boolean = false, callback: RPCCallback): void => {
    this.send('eth_getBlockByNumber', [blockNumber, includeTransactions], callback);
  }

  getBlockByHash = (blockHash: string, includeTransactions: boolean = false, callback: RPCCallback): void => {
    this.send('eth_getBlockByHash', [blockHash, includeTransactions], callback);
  }

  // ========== MÉTODOS DE FILTROS ==========

  newBlockFilter = (callback: RPCCallback): void => {
    this.send('eth_newBlockFilter', [], callback);
  }

  getFilterChanges = (filterId: string, callback: RPCCallback): void => {
    this.send('eth_getFilterChanges', [filterId], callback);
  }

  // ========== MÉTODOS DE CUENTAS ==========

  getAccounts = (callback: RPCCallback): void => {
    this.send('eth_accounts', [], callback);
  }

  // ========== MÉTODOS DE RED ==========

  netVersion = (callback: RPCCallback): void => {
    this.send('net_version', [], callback);
  }

  listening = (callback: RPCCallback): void => {
    this.send('net_listening', [], callback);
  }

  peerCount = (callback: RPCCallback): void => {
    this.send('net_peerCount', [], callback);
  }

  // ========== MÉTODOS UTILITARIOS ==========

  protocolVersion = (callback: RPCCallback): void => {
    this.send('eth_protocolVersion', [], callback);
  }

  syncing = (callback: RPCCallback): void => {
    this.send('eth_syncing', [], callback);
  }

  coinbase = (callback: RPCCallback): void => {
    this.send('eth_coinbase', [], callback);
  }

  mining = (callback: RPCCallback): void => {
    this.send('eth_mining', [], callback);
  }

  hashrate = (callback: RPCCallback): void => {
    this.send('eth_hashrate', [], callback);
  }
}




/*
// utils/ethereum.ts
//import { RPCProvider } from '@/lib/rpc-provider';

// Instancia global (opcional)
export const createEthereumProvider = (rpcUrl: string = 'http://127.0.0.1:8545'): RPCProvider => {
  return new RPCProvider(rpcUrl);
};

// Instancia preconfigurada para desarrollo
export const localProvider = createEthereumProvider('http://127.0.0.1:8545').getGasPrice();

// Instancia para diferentes redes
export const mainnetProvider = createEthereumProvider('https://mainnet.infura.io/v3/your-project-id');
export const sepoliaProvider = createEthereumProvider('https://sepolia.infura.io/v3/your-project-id');

*/