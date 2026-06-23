import React from "react";
import { usePatientForm } from "./hooks/usePatientForm";
import PatientFormFields from "./PatientFormFields";
import SuccessModal from "@/components/common/SuccessModal";
import { formatDisplayDate } from "@/utils/dateUtils";
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
    scheduledAppointmentDate,
    appointmentCreationFailed,
    handleSuccessModalConfirm,
  } = usePatientForm();

  return (
    <Card>
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Patient Registration
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Fill in the new patient information
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
          handleAssessmentConsultationChange={
            handleAssessmentConsultationChange
          }
          showAssessmentConsultation={true}
          validationErrors={validationErrors}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={isLoading}
            loadingText="Saving..."
            disabled={isLoading || !isFormValid()}
          >
            Register Patient
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        title="Patient registered!"
        message="The patient was successfully registered in the system."
        additionalInfo={
          <div
            className={`p-3 rounded-lg text-sm text-center ${
              scheduledAppointmentDate
                ? "bg-blue-50 text-blue-800 border border-blue-200"
                : appointmentCreationFailed
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-yellow-50 text-yellow-800 border border-yellow-200"
            }`}
          >
            {scheduledAppointmentDate ? (
              <div>
                <div>✓ Appointment scheduled automatically.</div>
                <div className="mt-1 font-semibold">
                  Date: {formatDisplayDate(scheduledAppointmentDate)}
                </div>
              </div>
            ) : appointmentCreationFailed ? (
              <div>
                <div className="font-medium">
                  Unable to schedule the first consultation.
                </div>
                <div className="mt-1">{appointmentCreationFailed.message}</div>
                <div className="mt-2 text-red-700">
                  You can schedule it manually in the schedule.
                </div>
              </div>
            ) : (
              <span>
                ⚠ No appointments were scheduled. You can schedule them manually
                in the schedule.
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
