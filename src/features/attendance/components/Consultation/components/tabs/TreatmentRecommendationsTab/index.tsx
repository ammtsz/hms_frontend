import React, { useCallback, useEffect, useRef } from "react";
import TreatmentRecommendationsSection from "./TreatmentRecommendationsSection";
import type { PostConsultationFormData } from "../../../hooks/usePostAttendanceForm";
import type { TreatmentRecommendation } from "../../../types";
import { Checkbox, Field, Input } from "@/components/ui";

interface TreatmentRecommendationsTabProps {
  formData: PostConsultationFormData;
  onRecommendationsChange: (recommendations: TreatmentRecommendation) => void;
  onFormDataChange: (
    field: keyof PostConsultationFormData,
    value: string | boolean,
  ) => void;
  treatmentStartDate: string; // YYYY-MM-DD format
}

const TreatmentRecommendationsTab: React.FC<
  TreatmentRecommendationsTabProps
> = ({
  formData,
  onRecommendationsChange,
  onFormDataChange,
  treatmentStartDate,
}) => {
  const prevHasActiveTreatmentsRef = useRef(false);

  const handleReturnWeeksChange = useCallback(
    (value: number) => {
      onRecommendationsChange({
        ...formData.recommendations,
        returnWeeks: Math.max(0, Math.min(52, value)),
      });
    },
    [formData.recommendations, onRecommendationsChange],
  );

  const handleReturnWhenTreatmentCompleteChange = useCallback(
    (checked: boolean) => {
      onRecommendationsChange({
        ...formData.recommendations,
        returnWhenTreatmentComplete: checked,
      });
    },
    [formData.recommendations, onRecommendationsChange],
  );

  const hasActiveTreatments =
    (formData.recommendations.physiotherapy?.treatments.length ?? 0) > 0 ||
    (formData.recommendations.tens?.treatments.length ?? 0) > 0;

  // Auto-set returnWhenTreatmentComplete based on treatment presence
  useEffect(() => {
    const prevHasActiveTreatments = prevHasActiveTreatmentsRef.current;

    // Set to true when treatments are FIRST added (transition from false to true)
    if (!prevHasActiveTreatments && hasActiveTreatments) {
      onRecommendationsChange({
        ...formData.recommendations,
        returnWhenTreatmentComplete: true,
      });
    }
    // Set to false when all treatments are removed (transition from true to false)
    else if (prevHasActiveTreatments && !hasActiveTreatments) {
      onRecommendationsChange({
        ...formData.recommendations,
        returnWhenTreatmentComplete: false,
      });
    }

    // Update ref for next render
    prevHasActiveTreatmentsRef.current = hasActiveTreatments;
  }, [hasActiveTreatments, formData.recommendations, onRecommendationsChange]);

  return (
    <div className="space-y-6">
      {/* Treatment Recommendations Component */}
      <TreatmentRecommendationsSection
        recommendations={formData.recommendations}
        onChange={onRecommendationsChange}
        treatmentStartDate={treatmentStartDate}
        disabled={formData.noTreatmentRecommendations ?? false}
      />

      {/* Acknowledgment checkbox - prevents accidental submit without reviewing */}
      <div className="py-6 my-6 border-y border-gray-200">
        {formData.patientStatus !== "A" &&
          !formData.noTreatmentRecommendations &&
          !hasActiveTreatments && (
            <div
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
              role="alert"
            >
              <p className="text-sm text-red-700">
                Adicione pelo menos um tratamento (fisioterapia ou TENS) ou
                marque a opção abaixo indicando que nenhum se aplica.
              </p>
            </div>
          )}
        <div className="flex items-start gap-3">
          <Checkbox
            id="noTreatmentRecommendations"
            data-testid="no-treatmentRecommendations-checkbox"
            checked={formData.noTreatmentRecommendations ?? false}
            onChange={(e) => {
              const checked = e.target.checked;
              onFormDataChange("noTreatmentRecommendations", checked);
              // When checked: clear treatments so return is scheduled via legacy mode (returnWeeks)
              if (checked && hasActiveTreatments) {
                onRecommendationsChange({
                  ...formData.recommendations,
                  physiotherapy: formData.recommendations.physiotherapy
                    ? {
                        ...formData.recommendations.physiotherapy,
                        treatments: [],
                      }
                    : undefined,
                  tens: formData.recommendations.tens
                    ? { ...formData.recommendations.tens, treatments: [] }
                    : undefined,
                  returnWhenTreatmentComplete: false,
                });
              }
            }}
            className="mt-2"
          />
          <div className="flex-1">
            <label
              htmlFor="noTreatmentRecommendations"
              className="text-sm font-medium text-gray-900 cursor-pointer"
            >
              Nenhum tratamento de fisioterapia ou TENS recomendado neste
              atendimento
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Marque esta opção se não houver indicação de fisioterapia ou TENS
              para este atendimento.
            </p>
          </div>
        </div>
      </div>

      {/* Return Consultation Scheduling Section */}
      <div className="pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Retorno da Consulta de Avaliação
        </h3>

        {/* Return When Treatment Complete Checkbox */}
        {hasActiveTreatments && (
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="returnWhenTreatmentComplete"
                checked={
                  formData.recommendations.returnWhenTreatmentComplete || false
                }
                onChange={(e) =>
                  handleReturnWhenTreatmentCompleteChange(e.target.checked)
                }
                className="mt-2"
              />
              <div className="flex-1">
                <label
                  htmlFor="returnWhenTreatmentComplete"
                  className="text-sm font-medium text-gray-900 cursor-pointer"
                >
                  Agendar retorno para quando o tratamento terminar
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  {`Quando ativado, a consulta de retorno será automaticamente
                  agendada para ${formData.recommendations.returnWeeks} semana(s) após a conclusão da última sessão de
                  tratamento. O sistema ajustará automaticamente para feriados.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Return Weeks Input - Always visible */}
        <Field
          label={
            <span
              className={
                formData.patientStatus === "A" ? "text-gray-500" : undefined
              }
            >
              {hasActiveTreatments &&
              formData.recommendations.returnWhenTreatmentComplete
                ? "Semanas para Retorno após o término do tratamento"
                : "Semanas para Retorno"}
              {formData.patientStatus !== "A" && " *"}
            </span>
          }
          htmlFor="returnWeeks"
          helpText={
            formData.patientStatus === "A"
              ? "Paciente com alta não necessita retorno"
              : formData.recommendations.returnWhenTreatmentComplete
                ? `Retorno será agendado para ${formData.recommendations.returnWeeks} semana(s) após o último tratamento`
                : formData.recommendations.returnWeeks === 0
                  ? "Nenhuma consulta de retorno será agendada"
                  : `Consulta será agendada para ${formData.recommendations.returnWeeks} semana(s) após esta consulta`
          }
        >
          <Input
            type="number"
            id="returnWeeks"
            value={formData.recommendations.returnWeeks}
            onChange={(e) =>
              handleReturnWeeksChange(parseInt(e.target.value) || 0)
            }
            min="0"
            max="52"
            disabled={formData.patientStatus === "A"}
          />
        </Field>

        {/* Warning for discharge */}
        {formData.patientStatus === "A" && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs text-amber-800 font-medium flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                Ao selecionar &quot;Alta do tratamento&quot;, o tratamento do
                paciente será encerrado. Esta ação indica que o paciente recebeu
                alta e não necessita mais de acompanhamento.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentRecommendationsTab;
