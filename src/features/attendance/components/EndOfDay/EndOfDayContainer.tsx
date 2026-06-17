import React from "react";
import BaseModal from "@/components/common/BaseModal";
import StepNavigation from "./components/StepNavigation";
import IncompleteAttendancesStep from "./components/steps/IncompleteAttendancesStep";
import AbsenceJustificationStep from "./components/steps/AbsenceJustificationStep";
import ConfirmationStep from "./components/steps/ConfirmationStep";
import SummaryStep from "./components/steps/SummaryStep";
import { useEndOfDay } from "./hooks/useEndOfDay";
import { useCloseModal, useEndOfDayModal } from "@/stores/modalStore";

const EndOfDayContainer: React.FC = () => {
  const endOfDay = useEndOfDayModal();
  const closeModal = useCloseModal();

  const selectedDate = endOfDay.selectedDate as string;

  const {
    currentStep,
    absenceJustifications,
    isSubmitting,
    processResult,
    scheduledAbsences,
    completedAttendances,
    incompleteAttendances,
    handleJustificationChange,
    handleNext,
    handleBack,
    handleSubmit,
    handleConclude,
  } = useEndOfDay({
    selectedDate,
  });

  const handleClose = () => {
    if (!isSubmitting) {
      closeModal("endOfDay");
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "incomplete":
        return (
          <IncompleteAttendancesStep
            incompleteAttendances={incompleteAttendances}
            selectedDate={selectedDate}
            onNext={handleNext}
            onCancel={handleClose}
          />
        );
      case "absences":
        return (
          <AbsenceJustificationStep
            scheduledAbsences={scheduledAbsences.map((absence) => ({
              patientId: absence.patientId || 0,
              patientName: absence.patientName,
              attendanceType: absence.attendanceType,
            }))}
            selectedDate={selectedDate}
            absenceJustifications={absenceJustifications}
            onJustificationChange={handleJustificationChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case "confirm":
        return (
          <ConfirmationStep
            selectedDate={selectedDate}
            completedAttendances={completedAttendances}
            scheduledAbsences={scheduledAbsences.map((absence) => ({
              patientId: absence.patientId || 0,
              patientName: absence.patientName,
              attendanceType: absence.attendanceType,
            }))}
            absenceJustifications={absenceJustifications}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        );
      case "summary":
        return processResult ? (
          <SummaryStep
            result={processResult}
            selectedDate={selectedDate}
            onConclude={handleConclude}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <BaseModal
      isOpen
      onClose={handleClose}
      title="Finalizar o Dia"
      maxWidth="4xl"
      preventOverflow
    >
      <div className="overflow-y-auto p-4 sm:p-6">
        {currentStep !== "summary" ? (
          <StepNavigation
            currentStep={currentStep}
            incompleteAttendancesCount={incompleteAttendances.length}
            scheduledAbsencesCount={scheduledAbsences.length}
          />
        ) : null}

        <div className="min-h-[400px]">{renderCurrentStep()}</div>
      </div>
    </BaseModal>
  );
};

export default EndOfDayContainer;
