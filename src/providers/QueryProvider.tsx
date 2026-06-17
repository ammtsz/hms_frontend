"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Create a client with optimized configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is considered stale after 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache garbage collection: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests up to 1 time (reduced from 2 for faster failures)
      retry: 1,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Disable background refetch when window gains focus (improves performance)
      refetchOnWindowFocus: false,
      // Enable background refetch when network is restored
      refetchOnReconnect: true,
      // Use structural sharing for better performance
      structuralSharing: true,
    },
    mutations: {
      // Don't retry mutations by default for faster user feedback
      retry: 0,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export { queryClient };
