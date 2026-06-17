import React from "react";
import type {
  PostConsultationFormData,
  PatientStatusValue,
} from "../../hooks/usePostAttendanceForm";
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
      // When assessment discharge (A) is selected, automatically set returnWeeks to 0
      onFormDataChange(name as keyof PostConsultationFormData, value);
      if (value === "A") {
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
          Informações Básicas do Atendimento
        </h3>
        <p className="text-sm text-gray-600">
          Complete as informações essenciais sobre esta consulta.
        </p>
      </div>

      <Field label="Queixa / Motivo da Consulta *" htmlFor="mainComplaint">
        <Textarea
          id="mainComplaint"
          name="mainComplaint"
          value={formData.mainComplaint}
          onChange={handleInputChange}
          rows={3}
          placeholder="Descreva a principal queixa ou motivo da consulta..."
          required
        />
      </Field>

      <div className="flex flex-col gap-4 md:flex-row">
        <Field
          label="Status do Tratamento *"
          htmlFor="patientStatus"
          helpText={`Status atual: ${getTreatmentStatusLabel(currentTreatmentStatus)}`}
          className="flex-1"
        >
          <Select
            id="patientStatus"
            name="patientStatus"
            value={formData.patientStatus}
            onChange={handleInputChange}
            required
          >
            <option value="T">T - Em tratamento</option>
            <option value="A">A - Alta do tratamento</option>
          </Select>
        </Field>
      </div>
      {formData.patientStatus === "A" && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
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

      <Field
        label={
          <span
            className={patientData?.startDate ? "text-gray-500" : undefined}
          >
            Data de Cadastro *
          </span>
        }
        htmlFor="startDate"
      >
        <Input
          type="date"
          id="startDate"
          value={formatDateForInput(formData.startDate)}
          onChange={onDateChange("startDate")}
          disabled={!!patientData?.startDate}
          required
        />
        {patientData?.startDate && (
          <p className="text-xs text-gray-400 mt-1">
            Data de cadastro não pode ser alterada (somente leitura)
          </p>
        )}
      </Field>

      <Field label="Notas da Consulta" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows={3}
          placeholder="Observações sobre o atendimento..."
        />
      </Field>
    </div>
  );
};

export default BasicInfoTab;
