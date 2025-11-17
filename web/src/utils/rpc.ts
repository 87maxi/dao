// utils/rpc-provider.ts
import { RPCRequest, RPCResponse, RPCCallback, IRPCProvider } from './types/rpc';

export class RPCProvider implements IRPCProvider {
  private rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  // ========== MÉTODO PRINCIPAL CON PROMISE ==========

  async sendPromise(method: string, params: any[] = []): Promise<any> {
    const request: RPCRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params: params.length > 0 ? params : undefined
    };

    console.log('📡 [RPC] Enviando request:', { 
      method, 
      params,
      url: this.rpcUrl 
    });

    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RPCResponse = await response.json();
      
      console.log('✅ [RPC] Respuesta recibida:', { 
        method, 
        result: data.result,
        error: data.error 
      });

      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message} (code: ${data.error.code})`);
      }

      return data.result;

    } catch (error: any) {
      console.error('❌ [RPC Error]:', { 
        method, 
        error: error.message,
        url: this.rpcUrl 
      });
      throw new Error(`Network error: ${error.message}`);
    }
  }

  // ========== MÉTODO ORIGINAL CON CALLBACK (para compatibilidad) ==========

  send = (method: string, params: any[] = [], callback: RPCCallback): void => {
    this.sendPromise(method, params)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  // ========== MÉTODOS ETHEREUM CON PROMISES ==========

  async getBlockNumber(): Promise<string> {
    return await this.sendPromise('eth_blockNumber');
  }

  async getBalance(address: string, block: string = 'latest'): Promise<string> {
    return await this.sendPromise('eth_getBalance', [address, block]);
  }

  async getChainId(): Promise<string> {
    return await this.sendPromise('eth_chainId');
  }

  async getGasPrice(): Promise<string> {
    return await this.sendPromise('eth_gasPrice');
  }

  async getTransactionCount(address: string, block: string = 'latest'): Promise<string> {
    return await this.sendPromise('eth_getTransactionCount', [address, block]);
  }

  async getCode(address: string, block: string = 'latest'): Promise<string> {
    return await this.sendPromise('eth_getCode', [address, block]);
  }

  async getStorageAt(address: string, position: string, block: string = 'latest'): Promise<string> {
    return await this.sendPromise('eth_getStorageAt', [address, position, block]);
  }

  // ========== MÉTODOS DE TRANSACCIONES CON PROMISES ==========

  async call(transaction: any, block: string = 'latest'): Promise<string> {
    return await this.sendPromise('eth_call', [transaction, block]);
  }

  async estimateGas(transaction: any): Promise<string> {
    return await this.sendPromise('eth_estimateGas', [transaction]);
  }

  async sendRawTransaction(signedTransaction: string): Promise<string> {
    return await this.sendPromise('eth_sendRawTransaction', [signedTransaction]);
  }

  async getTransactionReceipt(transactionHash: string): Promise<any> {
    return await this.sendPromise('eth_getTransactionReceipt', [transactionHash]);
  }

  // ========== MÉTODOS DE BLOQUES CON PROMISES ==========

  async getBlockByNumber(blockNumber: string, includeTransactions: boolean = false): Promise<any> {
    return await this.sendPromise('eth_getBlockByNumber', [blockNumber, includeTransactions]);
  }

  async getBlockByHash(blockHash: string, includeTransactions: boolean = false): Promise<any> {
    return await this.sendPromise('eth_getBlockByHash', [blockHash, includeTransactions]);
  }

  // ========== MÉTODOS DE FILTROS CON PROMISES ==========

  async newBlockFilter(): Promise<string> {
    return await this.sendPromise('eth_newBlockFilter');
  }

  async getFilterChanges(filterId: string): Promise<any[]> {
    return await this.sendPromise('eth_getFilterChanges', [filterId]);
  }

  // ========== MÉTODOS DE CUENTAS CON PROMISES ==========

  async getAccounts(): Promise<string[]> {
    return await this.sendPromise('eth_accounts');
  }

  // ========== MÉTODOS DE RED CON PROMISES ==========

  async netVersion(): Promise<string> {
    return await this.sendPromise('net_version');
  }

  async listening(): Promise<boolean> {
    return await this.sendPromise('net_listening');
  }

  async peerCount(): Promise<string> {
    return await this.sendPromise('net_peerCount');
  }

  // ========== MÉTODOS UTILITARIOS CON PROMISES ==========

  async protocolVersion(): Promise<string> {
    return await this.sendPromise('eth_protocolVersion');
  }

  async syncing(): Promise<any> {
    return await this.sendPromise('eth_syncing');
  }

  async coinbase(): Promise<string> {
    return await this.sendPromise('eth_coinbase');
  }

  async mining(): Promise<boolean> {
    return await this.sendPromise('eth_mining');
  }

  async hashrate(): Promise<string> {
    return await this.sendPromise('eth_hashrate');
  }

  // ========== MÉTODOS CON CALLBACKS (para mantener compatibilidad) ==========

  getBlockNumberCallback = (callback: RPCCallback): void => {
    this.getBlockNumber()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getBalanceCallback = (address: string, callback: RPCCallback, block: string = 'latest'): void => {
    this.getBalance(address, block)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getChainIdCallback = (callback: RPCCallback): void => {
    this.getChainId()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getGasPriceCallback = (callback: RPCCallback): void => {
    this.getGasPrice()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getTransactionCountCallback = (address: string, callback: RPCCallback, block: string = 'latest'): void => {
    this.getTransactionCount(address, block)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getCodeCallback = (address: string, callback: RPCCallback, block: string = 'latest'): void => {
    this.getCode(address, block)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getStorageAtCallback = (address: string, position: string, callback: RPCCallback, block: string = 'latest'): void => {
    this.getStorageAt(address, position, block)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  callCallback = (transaction: any, callback: RPCCallback, block: string = 'latest'): void => {
    this.call(transaction, block)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  estimateGasCallback = (transaction: any, callback: RPCCallback): void => {
    this.estimateGas(transaction)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  sendRawTransactionCallback = (signedTransaction: string, callback: RPCCallback): void => {
    this.sendRawTransaction(signedTransaction)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getTransactionReceiptCallback = (transactionHash: string, callback: RPCCallback): void => {
    this.getTransactionReceipt(transactionHash)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getBlockByNumberCallback = (blockNumber: string, includeTransactions: boolean = false, callback: RPCCallback): void => {
    this.getBlockByNumber(blockNumber, includeTransactions)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getBlockByHashCallback = (blockHash: string, includeTransactions: boolean = false, callback: RPCCallback): void => {
    this.getBlockByHash(blockHash, includeTransactions)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  newBlockFilterCallback = (callback: RPCCallback): void => {
    this.newBlockFilter()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getFilterChangesCallback = (filterId: string, callback: RPCCallback): void => {
    this.getFilterChanges(filterId)
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  getAccountsCallback = (callback: RPCCallback): void => {
    this.getAccounts()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  netVersionCallback = (callback: RPCCallback): void => {
    this.netVersion()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  listeningCallback = (callback: RPCCallback): void => {
    this.listening()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  peerCountCallback = (callback: RPCCallback): void => {
    this.peerCount()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  protocolVersionCallback = (callback: RPCCallback): void => {
    this.protocolVersion()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  syncingCallback = (callback: RPCCallback): void => {
    this.syncing()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  coinbaseCallback = (callback: RPCCallback): void => {
    this.coinbase()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  miningCallback = (callback: RPCCallback): void => {
    this.mining()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }

  hashrateCallback = (callback: RPCCallback): void => {
    this.hashrate()
      .then(result => callback(null, result))
      .catch(error => callback(error, null));
  }
}