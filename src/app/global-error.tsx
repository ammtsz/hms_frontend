'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary (L6).
 * Catches errors that bubble past all route-level error.tsx boundaries,
 * including errors in the root layout. Replaces the entire HTML document,
 * so it must include its own <html> and <body> tags.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global unhandled error:', error);
  }, [error]);

  return (
    <html lang="pt-br">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center font-sans">
          <h1 className="text-2xl font-bold text-gray-800">
            Erro crítico da aplicação
          </h1>
          <p className="text-gray-600 max-w-md">
            Não foi possível carregar o sistema. Por favor, recarregue a página
            ou entre em contato com o suporte.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400">Código: {error.digest}</p>
          )}
          <Button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Recarregar
          </Button>
        </div>
      </body>
    </html>
  );
}
