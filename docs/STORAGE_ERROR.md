# Solución al Error: Functions cannot be passed directly to Client Components

## Problema

Después de la migración a wagmi, se presentó el siguiente error:

```
Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
{getItem: function getItem, removeItem: ..., setItem: ..., key: ...}
```

Este error ocurre porque wagmi intenta usar `localStorage` directamente en el servidor durante el renderizado, lo cual no es posible ya que `localStorage` solo está disponible en el navegador.


## Causa

El problema se origina en la configuración de wagmi cuando se utiliza almacenamiento persistente. Durante el Server Side Rendering (SSR), Next.js intenta ejecutar todo el código en el servidor, pero `localStorage` no existe en el ambiente del servidor.


## Solución Implementada

Se creó una solución de almacenamiento personalizada que:

1. Verifica si el código se está ejecutando en el cliente (navegador) o en el servidor
2. En el cliente: utiliza `localStorage` normalmente
3. En el servidor: utiliza un almacenamiento "noop" (no operation) que devuelve valores predeterminados

### Código Implementado

```typescript
// Custom storage to handle SSR
const noopStorage = {
  getItem: (key: string) => Promise.resolve(null),
  setItem: (key: string, value: string) => Promise.resolve(),
  removeItem: (key: string) => Promise.resolve(),
};

// Create storage with SSR support
const getCustomStorage = () => {
  if (typeof window !== 'undefined') {
    return createStorage({
      storage: window.localStorage,
      key: 'wagmi',
    });
  }
  return noopStorage;
};

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(RPC_URL),
    [sepolia.id]: http(RPC_URL),
  },
  storage: getCustomStorage(),
});
```

## Resultado

Esta solución permite que:

- La aplicación se renderice correctamente en el servidor sin errores
- El estado de wagmi se persista en el navegador cuando el código se ejecuta en el cliente
- No haya intentos de acceder a `localStorage` en el servidor
- La funcionalidad completa de wagmi se mantenga en el cliente

## Consideraciones

- El estado no se puede persistir durante el SSR, lo cual es esperado
- La primera interacción del usuario será más rápida ya que no depende del estado previo
- La experiencia del usuario final no se ve afectada
- Esta es una solución común para bibliotecas que necesitan acceso al DOM en aplicaciones SSR

Creado con [Continue](https://continue.dev)

Co-Authored-By: Continue <noreply@continue.dev>