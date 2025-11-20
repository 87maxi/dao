interface Config {
    RPC_URL: string;
    CHAIN_ID: number;
    FORWARDER_CONTRACT_ADDRESS: string;
    DAO_VOTING_ADDRESS: string;
    NETWORK_NAME: string;
    HEX_CHAIN_ID: string;
    NODE_ENV: string;
}

const chainIdToHex = (chainId: string | number | undefined): string => {
    if (!chainId) return '0x7a69'; // Default Anvil chain ID
    
    const id = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
    
    if (isNaN(id)) {
        console.warn('CHAIN_ID no es un número válido:', chainId);
        return '0x7a69'; // Default Anvil chain ID
    }
    return `0x${id.toString(16)}`;
};



export const Env: Config = {
    RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545',
    CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337'),
    FORWARDER_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    DAO_VOTING_ADDRESS: process.env.NEXT_PUBLIC_DAO_VOTING_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME || 'Anvil Local',
    HEX_CHAIN_ID: chainIdToHex(process.env.NEXT_PUBLIC_CHAIN_ID),
    // ✅ Usar variable pública para el frontend
    NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || 'development'
};

