import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

// Create a public client for reading data
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

// Create a wallet client for writing data (when connected)
export const createWalletClientForAddress = (address: `0x${string}`) => {
  return createWalletClient({
    chain: mainnet,
    transport: custom((window as any).ethereum)
  })
}