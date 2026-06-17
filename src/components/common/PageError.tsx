import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

interface PageErrorProps {
  error: string;
  reset?: () => void;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  title?: string;
}

export const PageError: React.FC<PageErrorProps> = ({
  error,
  reset,
  showBackButton = true,
  backHref = "/patients",
  backLabel = "Voltar para Pacientes",
  title = "Ops! Algo deu errado",
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-red-200">
      <div className="p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-red-600 mb-6">{error}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {reset && (
            <Button
              onClick={reset}
              className="rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Tentar Novamente
            </Button>
          )}

          {showBackButton && (
            <Link
              href={backHref}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
