import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Anvil chain configuration
const anvil = {
  id: 31337,
  name: 'Anvil',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
      webSocket: ['ws://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
      webSocket: ['ws://127.0.0.1:8545'],
    },
  },
  testnet: true,
}

export const config = createConfig({
  chains: [anvil, mainnet, sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [anvil.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
