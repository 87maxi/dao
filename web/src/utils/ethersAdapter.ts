import { ethers } from 'ethers';
import { Env } from '@/utils/config';

/**
 * Convierte un WalletClient de wagmi v2 a un signer de ethers
 */
export async function walletClientToSigner(walletClient: any): Promise<ethers.Signer> {
  if (!walletClient) {
    throw new Error('WalletClient is required');
  }

  const { account } = walletClient;
  
  // Usar el RPC_URL directamente desde la configuración
  const provider = new ethers.JsonRpcProvider(Env.RPC_URL);
  
  // Para obtener un signer, necesitamos la clave privada o usar el provider con la cuenta conectada
  // Como no tenemos acceso a la clave privada, usaremos una aproximación diferente
  if (account && account.address) {
    // Devolver un signer que use el provider y la dirección
    // Nota: Esto solo funcionará para operaciones de lectura
    // Para operaciones de escritura necesitamos que el wallet esté conectado
    return provider.getSigner(account.address);
  }
  
  throw new Error('No account available in wallet client');
}

/**
 * Convierte un PublicClient de wagmi v2 a un provider de ethers
 */
export function publicClientToProvider(publicClient: any): ethers.JsonRpcProvider {
  if (!publicClient) {
    throw new Error('PublicClient is required');
  }

  // Usar el RPC_URL directamente desde la configuración
  return new ethers.JsonRpcProvider(Env.RPC_URL);
}

/**
 * Obtiene un provider de ethers directamente
 */
export function getEthersProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(Env.RPC_URL);
}

/**
 * Obtiene un signer de ethers para una dirección específica
 */
export function getEthersSigner(address: string): ethers.JsonRpcSigner {
  const provider = getEthersProvider();
  return provider.getSigner(address);
}
