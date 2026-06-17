import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/ui";

interface TemplateApplicationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  year: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    date: string;
    name: string;
    error: string;
  }>;
}

export const TemplateApplicationResultModal: React.FC<
  TemplateApplicationResultModalProps
> = ({
  isOpen,
  onClose,
  templateName,
  year,
  successCount,
  failureCount,
  errors,
}) => {
  const isFullSuccess = failureCount === 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isFullSuccess
          ? "Modelo Aplicado com Sucesso"
          : "Aplicação Parcial do Modelo"
      }
      maxWidth="2xl"
      preventOverflow
    >
      <div className="overflow-y-auto p-4 sm:p-6">
        <div
          className={`mb-6 flex items-start gap-3 rounded-lg p-2 ${
            isFullSuccess ? "bg-green-100" : "bg-amber-100"
          }`}
        >
          {isFullSuccess ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          )}
        </div>

        <p className="mb-2 text-gray-700">
          <strong>Modelo:</strong> {templateName}
        </p>
        <p className="mb-4 text-gray-700">
          <strong>Ano:</strong> {year}
        </p>

        {successCount > 0 ? (
          <div className="mb-4 flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="font-medium text-green-900">
                {successCount} feriado{successCount !== 1 ? "s" : ""} criado
                {successCount !== 1 ? "s" : ""} com sucesso
              </p>
              <p className="mt-1 text-sm text-green-700">
                {isFullSuccess
                  ? "Todos os feriados do modelo foram adicionados ao calendário."
                  : "Estes feriados foram adicionados ao calendário com sucesso."}
              </p>
            </div>
          </div>
        ) : null}

        {failureCount > 0 ? (
          <div className="mb-6 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                {failureCount} feriado
                {failureCount !== 1 ? "s não puderam" : " não pôde"} ser criado
                {failureCount !== 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Veja os detalhes abaixo para entender o motivo.
              </p>
            </div>
          </div>
        ) : null}

        {errors.length > 0 ? (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              Detalhes dos Erros:
            </h3>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div
                  key={`${error.date}-${error.name}-${index}`}
                  className="rounded-md border border-red-200 bg-red-50 p-3"
                >
                  <p className="text-sm font-medium text-red-900">
                    {error.date} - {error.name}
                  </p>
                  <p className="mt-1 text-sm text-red-700">{error.error}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end border-t border-gray-200 pt-4">
          <Button type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
