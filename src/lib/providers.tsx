'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useState } from 'react';

let globalQueryClient: QueryClient | null = null;

export function getQueryClient() {
  if (!globalQueryClient) {
    globalQueryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 1, staleTime: 1000 * 30 },
      },
    });
  }
  return globalQueryClient;
}

export function clearQueryCache() {
  if (globalQueryClient) {
    globalQueryClient.clear();
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(getQueryClient);

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster richColors position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
