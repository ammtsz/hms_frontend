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
        {formData.patientStatus !== "D" &&
          !formData.noTreatmentRecommendations &&
          !hasActiveTreatments && (
            <div
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
              role="alert"
            >
              <p className="text-sm text-red-700">
                Add at least one treatment (physiotherapy or TENS), or mark the
                option below indicating that none apply.
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
              No physiotherapy or TENS treatment is recommended in this
              appointment
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Check this option if there is no indication for Physiotherapy or
              TENS for this appointment.
            </p>
          </div>
        </div>
      </div>

      {/* Return Consultation Scheduling Section */}
      <div className="pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Assessment Consultation Return
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
                  Schedule a return when the treatment ends
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  {`When enabled, the return consultation will be automatically
                    scheduled for ${formData.recommendations.returnWeeks} week(s) after the completion of the last session of
                    treatment. The system will automatically adjust for holidays.`}
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
                formData.patientStatus === "D" ? "text-gray-500" : undefined
              }
            >
              {hasActiveTreatments &&
              formData.recommendations.returnWhenTreatmentComplete
                ? "Weeks until return after treatment ends"
                : "Weeks until return"}
              {formData.patientStatus !== "D" && " *"}
            </span>
          }
          htmlFor="returnWeeks"
          helpText={
            formData.patientStatus === "D"
              ? "Patient discharged does not require return"
              : formData.recommendations.returnWhenTreatmentComplete
                ? `The return will be scheduled for ${formData.recommendations.returnWeeks} week(s) after the last treatment`
                : formData.recommendations.returnWeeks === 0
                  ? "No return consultation will be scheduled"
                  : `A follow-up appointment will be scheduled for ${formData.recommendations.returnWeeks} week(s) after this consultation`
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
            disabled={formData.patientStatus === "D"}
          />
        </Field>

        {/* Warning for discharge */}
        {formData.patientStatus === "D" && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs text-amber-800 font-medium flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                When selecting &quot;Discharged&quot;, the patient&apos;s
                treatment will be closed. This action indicates that the patient
                has been discharged and no longer needs follow-up.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentRecommendationsTab;
