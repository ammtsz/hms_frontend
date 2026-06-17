import React from "react";
import type { PostConsultationFormData } from "../../hooks/usePostAttendanceForm";
import { Checkbox, Field, Input, Textarea } from "@/components/ui";

interface GeneralRecommendationsTabProps {
  formData: PostConsultationFormData;
  onFormDataChange: (
    field: keyof PostConsultationFormData,
    value: string | boolean,
  ) => void;
}

const GeneralRecommendationsTab: React.FC<GeneralRecommendationsTabProps> = ({
  formData,
  onFormDataChange,
}) => {
  const isFieldsDisabled = formData.noGeneralRecommendations ?? false;
  const labelClass = isFieldsDisabled ? "text-gray-400" : undefined;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    onFormDataChange(name as keyof PostConsultationFormData, value);
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Recomendações Gerais
        </h3>
        <p className="text-sm text-gray-600">
          Forneça orientações gerais sobre alimentação, hidratação e cuidados
          complementares.
        </p>
      </div>

      <Field
        label={<span className={labelClass}>Alimentação</span>}
        htmlFor="food"
        helpText="Orientações específicas sobre dieta e alimentação durante o tratamento"
      >
        <Textarea
          id="food"
          name="food"
          value={formData.food}
          onChange={handleInputChange}
          disabled={isFieldsDisabled}
          rows={3}
          placeholder="Recomendações alimentares (ex: evitar carnes vermelhas, priorizar vegetais, etc.)"
        />
      </Field>

      <Field
        label={<span className={labelClass}>Água</span>}
        htmlFor="water"
        helpText="Quantidade e tipo de água recomendada"
      >
        <Input
          type="text"
          id="water"
          name="water"
          value={formData.water}
          onChange={handleInputChange}
          disabled={isFieldsDisabled}
          placeholder="Ex: 2L de água por dia"
        />
      </Field>

      <Field
        label={<span className={labelClass}>Pomadas</span>}
        htmlFor="ointments"
        helpText="Produtos tópicos para aplicação externa"
      >
        <Input
          type="text"
          id="ointments"
          name="ointments"
          value={formData.ointments}
          onChange={handleInputChange}
          disabled={isFieldsDisabled}
          placeholder="Pomadas recomendadas..."
        />
      </Field>

      {/* Acknowledgment checkbox - prevents accidental submit without reviewing */}
      <div className="pt-4 border-t border-gray-200">
        {!formData.noGeneralRecommendations &&
          !(formData.food?.trim() ?? "").length &&
          !(formData.water?.trim() ?? "").length &&
          !(formData.ointments?.trim() ?? "").length && (
            <div
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
              role="alert"
            >
              <p className="text-sm text-red-700">
                Adicione pelo menos uma recomendação (alimentação, água ou
                pomadas) ou marque a opção abaixo indicando que nenhuma se
                aplica.
              </p>
            </div>
          )}
        <div className="flex items-start gap-3">
          <Checkbox
            id="noGeneralRecommendations"
            checked={formData.noGeneralRecommendations ?? false}
            onChange={(e) =>
              onFormDataChange("noGeneralRecommendations", e.target.checked)
            }
            className="mt-2"
          />
          <div className="flex-1">
            <label
              htmlFor="noGeneralRecommendations"
              className="text-sm font-medium text-gray-900 cursor-pointer"
            >
              Nenhuma recomendação geral se aplica a este atendimento
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Marque esta opção se não houver orientações de alimentação, água
              ou pomadas para este atendimento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralRecommendationsTab;
