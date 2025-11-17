// types/ethereum.ts
interface RPCRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any[];
}

interface RPCResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

type RPCCallback = (error: Error | null, result?: any) => void;

interface EthereumProvider {
  send: (method: string, params?: any[], callback?: RPCCallback) => void;
  getBlockNumber: (callback: RPCCallback) => void;
  getBalance: (address: string, callback: RPCCallback) => void;
}





export class BrowserRPCProvider implements EthereumProvider {
  private rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  send = (method: string, params: any[] = [], callback: RPCCallback): void => {
    const request: RPCRequest = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    };

    fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
      .then((res: Response) => res.json())
      .then((data: RPCResponse) => {
        if (data.error) {
          callback(new Error(data.error.message));
        } else {
          callback(null, data.result);
        }
      })
      .catch((err: Error) => callback(err));
  }

  getBlockNumber = (callback: RPCCallback): void => {
    this.send('eth_blockNumber', [], callback);
  }

  getBalance = (address: string, callback: RPCCallback): void => {
    this.send('eth_getBalance', [address, 'latest'], callback);
  }

  // Métodos adicionales con tipos específicos
  getTransactionCount = (address: string, block: string = 'latest', callback: RPCCallback): void => {
    this.send('eth_getTransactionCount', [address, block], callback);
  }

  getGasPrice = (callback: RPCCallback): void => {
    this.send('eth_gasPrice', [], callback);
  }

  call = (transaction: any, block: string = 'latest', callback: RPCCallback): void => {
    this.send('eth_call', [transaction, block], callback);
  }

  sendTransaction = (signedTransaction: string, callback: RPCCallback): void => {
    this.send('eth_sendRawTransaction', [signedTransaction], callback);
  }
}