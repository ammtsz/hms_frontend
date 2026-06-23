import React from "react";
import type {
  PostConsultationFormData,
  PatientStatusValue,
} from "../../hooks/usePostConsultationForm";
import type { PatientResponseDto } from "@/api/types";
import { getTreatmentStatusLabel } from "@/utils/patientUtils";
import { Field, Input, Select, Textarea } from "@/components/ui";

interface BasicInfoTabProps {
  formData: PostConsultationFormData;
  currentTreatmentStatus: PatientStatusValue;
  patientData: PatientResponseDto | null;
  onFormDataChange: (
    field: keyof PostConsultationFormData,
    value: string | number | Date,
  ) => void;
  onDateChange: (
    field: "startDate",
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  formData,
  currentTreatmentStatus,
  patientData,
  onFormDataChange,
  onDateChange,
}) => {
  // Format date for input field (YYYY-MM-DD) - already a string
  const formatDateForInput = (date: string) => {
    return date; // Date is already in YYYY-MM-DD format
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "returnWeeks") {
      onFormDataChange(
        name as keyof PostConsultationFormData,
        Math.max(0, Math.min(52, parseInt(value) || 0)),
      );
    } else if (name === "patientStatus") {
      // When assessment discharge (D) is selected, automatically set returnWeeks to 0
      onFormDataChange(name as keyof PostConsultationFormData, value);
      if (value === "D") {
        onFormDataChange("returnWeeks", 0);
      }
    } else {
      onFormDataChange(name as keyof PostConsultationFormData, value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Basic Appointment Information
        </h3>
        <p className="text-sm text-gray-600">
          Complete the essential information about this consultation.
        </p>
      </div>

      <Field
        label="Main Concern / Reason for Consultation *"
        htmlFor="mainConcern"
      >
        <Textarea
          id="mainConcern"
          name="mainConcern"
          value={formData.mainConcern}
          onChange={handleInputChange}
          rows={3}
          placeholder="Describe the main concern or reason for the consultation..."
          required
        />
      </Field>

      <div className="flex flex-col gap-4 md:flex-row">
        <Field
          label="Treatment Status *"
          htmlFor="patientStatus"
          helpText={`Current status: ${getTreatmentStatusLabel(currentTreatmentStatus)}`}
          className="flex-1"
        >
          <Select
            id="patientStatus"
            name="patientStatus"
            value={formData.patientStatus}
            onChange={handleInputChange}
            required
          >
            <option value="T">T - In treatment</option>
            <option value="D">D - Discharged</option>
          </Select>
        </Field>
      </div>
      {formData.patientStatus === "D" && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs text-amber-800 font-medium flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              Selecting &quot;Discharged&quot; will end the patient&apos;s
              treatment. This indicates the patient has been discharged and does
              not require further follow-up.
            </span>
          </p>
        </div>
      )}

      <Field
        label={
          <span
            className={patientData?.startDate ? "text-gray-500" : undefined}
          >
            Registration Date *
          </span>
        }
        htmlFor="startDate"
      >
        <Input
          type="date"
          lang="en-US"
          id="startDate"
          value={formatDateForInput(formData.startDate)}
          onChange={onDateChange("startDate")}
          disabled={!!patientData?.startDate}
          required
        />
        {patientData?.startDate && (
          <p className="text-xs text-gray-400 mt-1">
            Registration date cannot be changed (read-only)
          </p>
        )}
      </Field>

      <Field label="Consultation Notes" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows={3}
          placeholder="Consultation notes..."
        />
      </Field>
    </div>
  );
};

export default BasicInfoTab;
