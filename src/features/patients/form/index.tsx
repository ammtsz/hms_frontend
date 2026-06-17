import React from "react";
import { usePatientForm } from "./hooks/usePatientForm";
import PatientFormFields from "./PatientFormFields";
import SuccessModal from "@/components/common/SuccessModal";
import { formatDateBR } from "@/utils/dateUtils";
import { Button, Card } from "@/components/ui";

const PatientForm: React.FC = () => {
  const {
    patient,
    handleChange,
    handleAssessmentConsultationChange,
    handleSubmit,
    handleKeyDown,
    isLoading,
    validationErrors,
    isFormValid,
    showSuccessModal,
    scheduledAttendanceDate,
    attendanceCreationFailed,
    handleSuccessModalConfirm,
  } = usePatientForm();

  return (
    <Card>
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Cadastro de Paciente
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Preencha as informações do novo paciente
            </p>
          </div>
        </div>
      </div>

      <form
        className="p-4 space-y-6"
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      >
        <PatientFormFields
          patient={patient}
          handleChange={handleChange}
          handleAssessmentConsultationChange={handleAssessmentConsultationChange}
          showAssessmentConsultation={true}
          validationErrors={validationErrors}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={isLoading}
            loadingText="Salvando..."
            disabled={isLoading || !isFormValid()}
          >
            Cadastrar Paciente
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        title="Paciente cadastrado!"
        message="O paciente foi cadastrado com sucesso no sistema."
        additionalInfo={
          <div
            className={`p-3 rounded-lg text-sm text-center ${
              scheduledAttendanceDate
                ? "bg-blue-50 text-blue-800 border border-blue-200"
                : attendanceCreationFailed
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-yellow-50 text-yellow-800 border border-yellow-200"
            }`}
          >
            {scheduledAttendanceDate ? (
              <div>
                <div>✓ Atendimento agendado automaticamente.</div>
                <div className="mt-1 font-semibold">
                  Data: {formatDateBR(scheduledAttendanceDate)}
                </div>
              </div>
            ) : attendanceCreationFailed ? (
              <div>
                <div className="font-medium">
                  Não foi possível agendar a primeira consulta.
                </div>
                <div className="mt-1">{attendanceCreationFailed.message}</div>
                <div className="mt-2 text-red-700">
                  Você pode agendar manualmente na agenda.
                </div>
              </div>
            ) : (
              <span>
                ⚠ Nenhum atendimento foi agendado. Você pode agendar manualmente
                na agenda.
              </span>
            )}
          </div>
        }
        onConfirm={handleSuccessModalConfirm}
      />
    </Card>
  );
};

export default PatientForm;
