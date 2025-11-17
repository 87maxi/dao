export interface RPCRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any[];
}

export interface RPCResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export type RPCCallback = (error: Error | null, result?: any) => void;

export interface IRPCProvider {
  send: (method: string, params?: any[], callback?: RPCCallback) => void;
  getBlockNumber: (callback: RPCCallback) => void;
  getBalance: (address: string, callback: RPCCallback) => void;
  getChainId: (callback: RPCCallback) => void;
  getGasPrice: (callback: RPCCallback) => void;
}