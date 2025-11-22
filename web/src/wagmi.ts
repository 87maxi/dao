import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { Env } from './utils/config';

// Crear configuración de cadena personalizada para Anvil
const anvilChain = {
  id: Env.CHAIN_ID,
  name: Env.NETWORK_NAME,
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [Env.RPC_URL],
    },
    public: {
      http: [Env.RPC_URL],
    },
  },
  testnet: true,
};

export const config = createConfig({
  chains: [anvilChain, mainnet, sepolia],
  transports: {
    [anvilChain.id]: http(Env.RPC_URL),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}