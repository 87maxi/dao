"use client";

import { PropsWithChildren, useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../wagmi';

// Crear el QueryClient fuera del componente para evitar recrearlo
const createQueryClient = () => 
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutos
      },
    },
  });

export function WagmiProviderWrapper({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);
  const [isReady, setIsReady] = useState(false);

  // Esperar hasta que el componente esté completamente montado y el DOM esté listo
  useEffect(() => {
    // Timeout para asegurar que la hidratación esté completa
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      queryClient.clear();
    };
  }, [queryClient]);

  // No renderizar nada del provider hasta que esté completamente listo
  // Esto previene problemas de hidratación con wagmi
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider 
      config={config} 
      reconnectOnMount={false}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
