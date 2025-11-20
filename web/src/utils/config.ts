 interface Config  { 

        NEXT_PUBLIC_INFURA_ID:  string;
        NEXT_PUBLIC_ALCHEMY_ID: string
        NEXT_PUBLIC_CONTRACT_ADDRESS: 0x0000000000000000000000000000000000000000
        CHAIN_ID: number;
        RELAYER_PRIVATE_KEY: string;        
        RPC_URL: string;
        FORWARDER_CONTRACT_ADDRESS: string;
        DAO_VOTING_ADDRESS: string;
        MAX_GAS_LIMIT: number;
        LOCK_TIMEOUT: number;
        NETWORK_NAME: string;
        HEX_CHAIN_ID: string;
   }



const chainIdToHex = (chainId: string | number | undefined): string | undefined => {
    if (!chainId) return undefined;
    
    const id = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
    
    if (isNaN(id)) {
        console.warn('CHAIN_ID no es un número válido:', chainId);
        return undefined;
    }
    return `0x${id.toString(16)}`;
};


console.log(chainIdToHex(process.env.CHAIN_ID))

export   const Env  : Config = {

    RPC_URL: process.env.RPC_URL,
    CHAIN_ID: process.env.CHAIN_ID,
    FORWARDER_CONTRACT_ADDRESS: process.env.FORWARDER_CONTRACT_ADDRESS,
    DAO_VOTING_ADDRESS : process.env.DAO_VOTING_ADDRESS,
    NETWORK_NAME: process.env.NETWOR_NAME,
    HEX_CHAIN_ID: chainIdToHex(process.env.CHAIN_ID)

   }























