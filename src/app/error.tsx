'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary (L6).
 * Catches runtime errors in a route segment and shows a user-friendly
 * fallback instead of a raw stack trace.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-800">
        Ocorreu um erro inesperado
      </h2>
      <p className="text-gray-600 max-w-md">
        Algo deu errado ao carregar esta página. Por favor, tente novamente.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400">Código: {error.digest}</p>
      )}
      <Button
        onClick={reset}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Tentar novamente
      </Button>
    </div>
  );
}
