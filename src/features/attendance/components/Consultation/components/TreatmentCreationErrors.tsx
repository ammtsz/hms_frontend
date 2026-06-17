import React from "react";
import { Button } from "@/components/ui";

export interface TreatmentCreationError {
  treatmentType: "physiotherapy" | "tens";
  errors: string[];
}

interface TreatmentCreationErrorsProps {
  /** Array of treatment session creation errors */
  errors: TreatmentCreationError[];
  /** Patient name for personalized messaging */
  patientName: string;
  /** Callback when user acknowledges the errors and wants to retry */
  onRetry?: () => void;
  /** Callback when user acknowledges the errors and wants to continue */
  onContinue: () => void;
  /** Optional custom message */
  customMessage?: string;
}

/**
 * TreatmentCreationErrors - Displays detailed error information when treatment sessions
 * or their automatic attendances fail to be created
 */
const TreatmentCreationErrors: React.FC<TreatmentCreationErrorsProps> = ({
  errors,
  patientName,
  onRetry,
  onContinue,
  customMessage,
}) => {
  const getTreatmentIcon = (type: "physiotherapy" | "tens"): string => {
    return type === "physiotherapy" ? "✨" : "🪄";
  };

  const getTreatmentName = (type: "physiotherapy" | "tens"): string => {
    return type === "physiotherapy" ? "Fisioterapia" : "TENS";
  };

  const totalErrors = errors.reduce(
    (sum, error) => sum + error.errors.length,
    0,
  );

  return (
    <div className="bg-white border-2 border-red-200 rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-2 mb-2">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-2xl font-bold text-red-700">
            Problemas ao Criar Sessões
          </h2>
        </div>
        <p className="text-gray-600">
          {customMessage || (
            <>
              Ocorreram problemas ao criar as sessões de tratamento e/ou
              agendamentos automáticos para{" "}
              <span className="font-semibold text-gray-800">{patientName}</span>
              .
            </>
          )}
        </p>
      </div>

      {/* Error Summary */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📊</span>
          <h3 className="font-semibold text-red-800">Resumo dos Problemas</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="bg-white p-3 rounded">
            <div className="text-red-600 font-medium">Total de Erros</div>
            <div className="text-xl font-bold text-red-700">{totalErrors}</div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="text-red-600 font-medium">Tratamentos Afetados</div>
            <div className="text-xl font-bold text-red-700">
              {errors.length}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Error Information */}
      <div className="space-y-4 mb-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span>📋</span>
          Detalhes dos Problemas
        </h3>

        {errors.map((treatmentError, index) => (
          <div
            key={index}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">
                {getTreatmentIcon(treatmentError.treatmentType)}
              </span>
              <h4 className="font-semibold text-red-800">
                {getTreatmentName(treatmentError.treatmentType)}
              </h4>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                {treatmentError.errors.length} erro
                {treatmentError.errors.length !== 1 ? "s" : ""}
              </span>
            </div>

            <ul className="space-y-2">
              {treatmentError.errors.map((error, errorIndex) => (
                <li
                  key={errorIndex}
                  className="flex items-start gap-2 text-sm text-red-700"
                >
                  <span className="text-red-500 mt-1">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">✨</span>
          <h3 className="font-semibold text-yellow-800">Recomendações</h3>
        </div>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>
            • Verifique se já existem agendamentos conflitantes para este
            paciente
          </li>
          <li>• Confirme se as configurações de horário estão corretas</li>
          <li>• Tente novamente em alguns minutos</li>
          <li>• Se o problema persistir, contate o suporte técnico</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse gap-3 justify-center sm:flex-row">
        {onRetry && (
          <Button type="button" onClick={onRetry}>
            Voltar
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onContinue}>
          Continuar Mesmo Assim
        </Button>
      </div>

      {/* Footer Note */}
      <div className="mt-4 text-center text-xs text-gray-500">
        ✨ O registro de tratamento foi salvo com sucesso. Apenas os
        agendamentos automáticos apresentaram problemas.
      </div>
    </div>
  );
};

export default TreatmentCreationErrors;
