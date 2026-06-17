import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HelpCircle } from "lucide-react";
import TreatmentRecommendationTable from "@/features/attendance/components/TreatmentRecommendations/TreatmentRecommendationTable";
import type {
  TreatmentRecommendation,
  PhysiotherapyLocationTreatment,
  TensLocationTreatment,
} from "../../../types";
import { Button, Field, Textarea } from "@/components/ui";

// Initialize empty treatment structure for a given type
const initializeTreatment = (startDate: string) => ({
  startDate,
  treatments: [],
});

interface TreatmentRecommendationsSectionProps {
  recommendations: TreatmentRecommendation;
  onChange: (recommendations: TreatmentRecommendation) => void;
  treatmentStartDate: string; // YYYY-MM-DD format - from patient's treatment start date or consultation date
  disabled?: boolean; // When true (e.g. "no treatment recommendations" checked), disable all fields
}

const TreatmentRecommendationsSection: React.FC<
  TreatmentRecommendationsSectionProps
> = ({ recommendations, onChange, treatmentStartDate, disabled = false }) => {
  const [showPhysiotherapyInstructions, setShowPhysiotherapyInstructions] =
    useState(false);
  const [showTensInstructions, setShowTensInstructions] = useState(false);
  const [showTips, setShowTips] = useState(false);
  // Initialize treatment structures on mount if not present
  useEffect(() => {
    if (!recommendations.physiotherapy || !recommendations.tens) {
      onChange({
        ...recommendations,
        physiotherapy:
          recommendations.physiotherapy ||
          initializeTreatment(treatmentStartDate),
        tens: recommendations.tens || initializeTreatment(treatmentStartDate),
      });
    }
    // TODO: revisit this hook and see if it can be simplified
    // Intentionally mirrors the existing initialization flow; revisiting this hook is separate from the UI migration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treatmentStartDate]);

  // Default quantity for new rows: same-type last row, or other type's last row, or 1
  const physiotherapyDefaultQuantity = useMemo(() => {
    const physiotherapy = recommendations.physiotherapy?.treatments ?? [];
    const tens = recommendations.tens?.treatments ?? [];
    if (physiotherapy.length > 0) {
      return physiotherapy[physiotherapy.length - 1].quantity;
    }
    if (tens.length > 0) {
      return tens[tens.length - 1].quantity;
    }
    return 1;
  }, [
    recommendations.physiotherapy?.treatments,
    recommendations.tens?.treatments,
  ]);

  const tensDefaultQuantity = useMemo(() => {
    const tens = recommendations.tens?.treatments ?? [];
    const physiotherapy = recommendations.physiotherapy?.treatments ?? [];
    if (tens.length > 0) {
      return tens[tens.length - 1].quantity;
    }
    if (physiotherapy.length > 0) {
      return physiotherapy[physiotherapy.length - 1].quantity;
    }
    return 1;
  }, [
    recommendations.tens?.treatments,
    recommendations.physiotherapy?.treatments,
  ]);

  // Default start date for first row of each type: same-type last row, or other type's last row, or undefined (fall back to schedule rules)
  const physiotherapyDefaultStartDate = useMemo(() => {
    const physiotherapy = recommendations.physiotherapy?.treatments ?? [];
    const tens = recommendations.tens?.treatments ?? [];
    if (physiotherapy.length > 0) {
      return physiotherapy[physiotherapy.length - 1].startDate;
    }
    if (tens.length > 0) {
      return tens[tens.length - 1].startDate;
    }
    return undefined;
  }, [
    recommendations.physiotherapy?.treatments,
    recommendations.tens?.treatments,
  ]);

  const tensDefaultStartDate = useMemo(() => {
    const tens = recommendations.tens?.treatments ?? [];
    const physiotherapy = recommendations.physiotherapy?.treatments ?? [];
    if (tens.length > 0) {
      return tens[tens.length - 1].startDate;
    }
    if (physiotherapy.length > 0) {
      return physiotherapy[physiotherapy.length - 1].startDate;
    }
    return undefined;
  }, [
    recommendations.tens?.treatments,
    recommendations.physiotherapy?.treatments,
  ]);

  const handlePhysiotherapyTreatmentsChange = useCallback(
    (
      treatments: (PhysiotherapyLocationTreatment | TensLocationTreatment)[],
    ) => {
      if (!recommendations.physiotherapy) return;

      onChange({
        ...recommendations,
        physiotherapy: {
          ...recommendations.physiotherapy,
          treatments: treatments as PhysiotherapyLocationTreatment[],
        },
      });
    },
    [recommendations, onChange],
  );

  // Shared notes for both physiotherapy and tens – same value saved for both on backend
  const handleTreatmentNotesChange = useCallback(
    (notes: string) => {
      onChange({
        ...recommendations,
        physiotherapy: recommendations.physiotherapy
          ? { ...recommendations.physiotherapy, notes }
          : undefined,
        tens: recommendations.tens
          ? { ...recommendations.tens, notes }
          : undefined,
      });
    },
    [recommendations, onChange],
  );

  const hasActiveTreatments =
    (recommendations.physiotherapy?.treatments.length ?? 0) > 0 ||
    (recommendations.tens?.treatments.length ?? 0) > 0;

  // TENS Handlers

  const handleTensTreatmentsChange = useCallback(
    (
      treatments: (PhysiotherapyLocationTreatment | TensLocationTreatment)[],
    ) => {
      if (!recommendations.tens) return;

      onChange({
        ...recommendations,
        tens: {
          ...recommendations.tens,
          treatments: treatments as TensLocationTreatment[],
        },
      });
    },
    [recommendations, onChange],
  );

  const hasPhysiotherapyTreatments =
    recommendations.physiotherapy?.treatments.length &&
    recommendations.physiotherapy?.treatments.length > 0;
  const hasTensTreatments =
    recommendations.tens?.treatments.length &&
    recommendations.tens?.treatments.length > 0;

  const physiotherapyTitleClass = disabled
    ? "text-base font-semibold text-gray-400"
    : "text-base font-semibold text-yellow-600";
  const tensTitleClass = disabled
    ? "text-base font-semibold text-gray-400"
    : "text-base font-semibold text-blue-700";
  const labelClass = disabled ? "text-gray-400" : undefined;
  const mainTitleClass = disabled
    ? "text-lg font-medium text-gray-400"
    : "text-lg font-medium text-gray-800";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={mainTitleClass}>Recomendações de Tratamento</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowTips(!showTips)}
          className="text-green-700 hover:text-green-800"
        >
          <HelpCircle size={16} />
          {showTips ? "Ocultar dicas" : "Ver dicas"}
        </Button>
      </div>

      {showTips && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <ul className="text-sm text-green-800 space-y-1">
            <li>
              • Os tratamentos configurados aqui serão automaticamente agendados
            </li>
            <li>• Cada sessão será criada com intervalos semanais</li>
            <li>• É possível ajustar datas individuais após a criação</li>
          </ul>
        </div>
      )}

      {/* Physiotherapy Section */}
      <div className="border-2 border-gray-200 rounded-lg p-4">
        <div className={hasPhysiotherapyTreatments ? "mb-6" : ""}>
          <div className="flex flex-col items-start gap-0.5">
            <h4 className={physiotherapyTitleClass}>Fisioterapia</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setShowPhysiotherapyInstructions(!showPhysiotherapyInstructions)
              }
              className="text-gray-500 hover:text-gray-700"
            >
              <HelpCircle size={16} />
              {showPhysiotherapyInstructions ? "Ocultar" : "Como configurar"}
            </Button>
          </div>
        </div>
        {showPhysiotherapyInstructions && (
          <div
            className={`mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md ${hasPhysiotherapyTreatments ? "" : "mt-6"}`}
          >
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                • <strong>Passo 1:</strong> Clique em &quot;+ Adicionar
                Tratamento&quot; abaixo para criar uma nova linha
              </li>
              <li>
                • <strong>Passo 2:</strong> Clique na linha para editar e
                selecione os locais do corpo digitando ou escolhendo da lista
              </li>
              <li>
                • <strong>Passo 3:</strong> Configure os parâmetros: cor da luz,
                duração (minutos) e quantidade de sessões
              </li>
              <li>
                • <strong>Passo 4:</strong> Defina a data de início do
                tratamento (padrão: 7 dias a partir de hoje)
              </li>
              <li>
                • <strong>Dica:</strong> Você pode criar novos locais do corpo
                digitando e clicando em &quot;✨ Criar&quot;
              </li>
              <li>
                • Clique no ícone de check (✓) para salvar, ou no ícone da
                lixeira (🗑️) para remover
              </li>
            </ul>
          </div>
        )}
        {recommendations.physiotherapy && (
          <>
            <TreatmentRecommendationTable
              treatmentType="physiotherapy"
              treatments={recommendations.physiotherapy.treatments}
              onChange={handlePhysiotherapyTreatmentsChange}
              defaultQuantity={physiotherapyDefaultQuantity}
              defaultStartDate={physiotherapyDefaultStartDate}
              disabled={disabled}
            />
          </>
        )}
      </div>

      {/* TENS Section */}
      <div className="border-2 border-gray-200 rounded-lg p-4">
        <div className={hasTensTreatments ? "mb-6" : ""}>
          <div className="flex flex-col items-start gap-0.5">
            <h4 className={tensTitleClass}>TENS</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowTensInstructions(!showTensInstructions)}
              className="text-gray-500 hover:text-gray-700"
            >
              <HelpCircle size={16} />
              {showTensInstructions ? "Ocultar" : "Como configurar"}
            </Button>
          </div>
        </div>
        {showTensInstructions && (
          <div
            className={`mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md ${hasTensTreatments ? "" : "mt-6"}`}
          >
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                • <strong>Passo 1:</strong> Clique em &quot;+ Adicionar
                Tratamento&quot; abaixo para criar uma nova linha
              </li>
              <li>
                • <strong>Passo 2:</strong> Clique na linha para editar e
                selecione os locais do corpo digitando ou escolhendo da lista
              </li>
              <li>
                • <strong>Passo 3:</strong> Configure os parâmetros: quantidade
                de sessões
              </li>
              <li>
                • <strong>Passo 4:</strong> Defina a data de início do
                tratamento (padrão: 7 dias a partir de hoje)
              </li>
              <li>
                • <strong>Dica:</strong> Você pode criar novos locais do corpo
                digitando e clicando em &quot;✨ Criar&quot;
              </li>
              <li>
                • Clique no ícone de check (✓) para salvar, ou no ícone da
                lixeira (🗑️) para remover
              </li>
            </ul>
          </div>
        )}
        {recommendations.tens && (
          <>
            <TreatmentRecommendationTable
              treatmentType="tens"
              treatments={recommendations.tens.treatments}
              onChange={handleTensTreatmentsChange}
              defaultQuantity={tensDefaultQuantity}
              defaultStartDate={tensDefaultStartDate}
              disabled={disabled}
            />
          </>
        )}
      </div>

      {/* Shared notes – shown only when at least one treatment (physiotherapy or tens) is added */}
      {hasActiveTreatments && (
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <Field
            label={
              <span className={labelClass}>
                📝 Observações - Tratamentos (Fisioterapia / TENS) (Opcional)
              </span>
            }
          >
            <Textarea
              value={
                recommendations.physiotherapy?.notes ??
                recommendations.tens?.notes ??
                ""
              }
              onChange={(e) => handleTreatmentNotesChange(e.target.value)}
              disabled={disabled}
              placeholder="Observações sobre as sessões de Fisioterapia e TENS..."
              maxLength={500}
              rows={3}
              className="resize-none text-sm"
            />
          </Field>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {
              (
                recommendations.physiotherapy?.notes ??
                recommendations.tens?.notes ??
                ""
              ).length
            }
            /500 caracteres
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentRecommendationsSection;
