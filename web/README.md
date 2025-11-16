This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



```bash

# ABI Y BYTECODE


# Obtener ABI de un contrato
forge inspect DocumentRegistry abi
forge inspect DocumentRegistry abi --raw

# Obtener bytecode
forge inspect DocumentRegistry bytecode
forge inspect DocumentRegistry bytecode --raw

# Obtener deployed bytecode
forge inspect DocumentRegistry deployedBytecode

# Guardar ABI en archivo
forge inspect DocumentRegistry abi --raw > ./src/abi/DocumentRegistryABI.json


# DEPLOYMENT

# Desplegar contrato
forge create src/DocumentRegistry.sol:DocumentRegistry \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Desplegar con broadcast (guarda transacción)
forge create src/DocumentRegistry.sol:DocumentRegistry \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast




#VERIFICACIÓN Y DEBUG


# Verificar código de contrato
cast code 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545

# Verificar nonce de cuenta
cast nonce  --rpc-url http://localhost:8545

# Calcular dirección de contrato
cast compute-address 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --nonce 0

# Llamar función view
cast call 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 "getDocumentInfo(bytes32)" 0x0000000000000000000000000000000000000000000000000000000000000000 --rpc-url http://localhost:8545

# Ver balance
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545

# Ver bloque actual
cast block-number --rpc-url http://localhost:8545



# Ejecutar script de deployment
forge script script/DeployDocumentRegistry.s.sol:DeployDocumentRegistry \
  --rpc-url http://localhost:8545 \
  --broadcast


#UTILIDADES

# Convertir private key a address
cast address --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Firmar mensaje (para testing)
cast sign "hello" --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Ver transacción
cast tx <TX_HASH> --rpc-url http://localhost:8545

```