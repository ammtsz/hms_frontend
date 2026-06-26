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
          Provide guidance on home exercises, pain management, and medications.
        </p>
      </div>

      <Field
        label={<span className={labelClass}>Home Exercises</span>}
        htmlFor="homeExercises"
        helpText="Exercises the patient should perform at home"
      >
        <Textarea
          id="homeExercises"
          name="homeExercises"
          value={formData.homeExercises}
          onChange={handleInputChange}
          disabled={isFieldsDisabled}
          rows={3}
          placeholder="Home exercise recommendations (e.g. stretching, strengthening, etc.)"
        />
      </Field>

      <Field
        label={<span className={labelClass}>Pain Management</span>}
        htmlFor="painManagement"
        helpText="Strategies for managing pain between sessions"
      >
        <Textarea
          id="painManagement"
          name="painManagement"
          value={formData.painManagement}
          onChange={handleInputChange}
          disabled={isFieldsDisabled}
          rows={3}
          placeholder="Pain management guidance (e.g. ice/heat, rest, posture, etc.)"
        />
      </Field>

      <Field
        label={<span className={labelClass}>Medications</span>}
        htmlFor="medications"
        helpText="Medication recommendations or reminders"
      >
        <Input
          type="text"
          id="medications"
          name="medications"
          value={formData.medications}
          onChange={handleInputChange}
          disabled={isFieldsDisabled}
          placeholder="Recommended medications or supplements..."
        />
      </Field>

      <div className="pt-4 border-t border-gray-200">
        {!formData.noGeneralRecommendations &&
          !(formData.homeExercises?.trim() ?? "").length &&
          !(formData.painManagement?.trim() ?? "").length &&
          !(formData.medications?.trim() ?? "").length && (
            <div
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
              role="alert"
            >
              <p className="text-sm text-red-700">
                Add at least one recommendation (home exercises, pain
                management, or medications), or mark the option below indicating
                that none apply.
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
              Check this option if there are no home exercise, pain management,
              or medication recommendations for this appointment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralRecommendationsTab;
