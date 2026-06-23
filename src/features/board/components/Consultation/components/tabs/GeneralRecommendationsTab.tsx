import React from "react";
import type { PostConsultationFormData } from "../../hooks/usePostConsultationForm";
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
          General Recommendations
        </h3>
        <p className="text-sm text-gray-600">
          Provide general guidance on food, hydration, and complementary care.
        </p>
      </div>

      <Field
        label={<span className={labelClass}>Food</span>}
        htmlFor="food"
        helpText="Specific guidance on diet and food during treatment"
      >
        <Textarea
          id="food"
          name="food"
          value={formData.food}
          onChange={handleInputChange}
          disabled={isFieldsDisabled}
          rows={3}
          placeholder="Dietary recommendations (e.g. avoid red meat, prioritize vegetables, etc.)"
        />
      </Field>

      <Field
        label={<span className={labelClass}>Water</span>}
        htmlFor="water"
        helpText="Recommended amount and type of water"
      >
        <Input
          type="text"
          id="water"
          name="water"
          value={formData.water}
          onChange={handleInputChange}
          disabled={isFieldsDisabled}
          placeholder="e.g. 2L of water per day"
        />
      </Field>

      <Field
        label={<span className={labelClass}>Ointments</span>}
        htmlFor="ointments"
        helpText="Topical products for external application"
      >
        <Input
          type="text"
          id="ointments"
          name="ointments"
          value={formData.ointments}
          onChange={handleInputChange}
          disabled={isFieldsDisabled}
          placeholder="Recommended ointments..."
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
                Add at least one recommendation (food, water, or ointments), or
                mark the option below indicating that none apply.
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
              No general recommendations apply to this appointment
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Check this option if there are no diet, hydration, or ointment
              recommendations for this appointment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralRecommendationsTab;
