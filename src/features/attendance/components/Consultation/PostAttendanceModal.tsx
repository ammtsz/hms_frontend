import React, { useCallback, useEffect } from "react";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import TabbedModal from "@/components/common/TabbedModal";
import { Button } from "@/components/ui";
import {
  hasInvalidTreatmentStartDates,
  useScheduleSettings,
} from "@/api/query/hooks/useScheduleSettingQueries";
import { usePostAttendanceForm } from "./hooks/usePostAttendanceForm";
import {
  BasicInfoTab,
  GeneralRecommendationsTab,
  TreatmentRecommendationsTab,
} from "./components/tabs";
import CreatedTreatmentsConfirmation from "./components/CreatedTreatmentsConfirmation";
import TreatmentCreationErrors from "./components/TreatmentCreationErrors";
import type {
  PostConsultationFormData,
  PatientStatusValue,
} from "./hooks/usePostAttendanceForm";
import { usePostAttendanceModal, useCloseModal } from "@/stores/modalStore";

const PostAttendanceModal: React.FC = () => {
  // // Get state from Zustand store
  const postAttendance = usePostAttendanceModal();
  const closeModal = useCloseModal();

  // // Extract values from store
  const { attendanceId, patientId, patientName, currentTreatmentStatus } =
    postAttendance;

  // Post-consultation modal: form and submission live in usePostAttendanceForm
  const {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    handleRecommendationsChange,
    handleDateChange,
    patientData,
    fetchError,
    setFetchError,
    isLoading,
    error,
    clearError,
    showConfirmation,
    createdTreatments,
    resetConfirmation,
    cancelledAttendances,
    newlyScheduledAttendances,
    fetchingAttendances,
    attendancesError,
    showErrors,
    treatmentCreationErrors,
    resetErrors,
    retryTreatmentCreation,
    handleCancel,
  } = usePostAttendanceForm();

  // Tab validation logic - simplified for now
  const [activeTab, setActiveTab] = React.useState("basic");

  // Reset active tab when modal opens with new attendance
  useEffect(() => {
    if (postAttendance.isOpen && attendanceId) {
      setActiveTab("basic");
    }
  }, [postAttendance.isOpen, attendanceId]);

  // When treatment discharge (A) is selected, leave the treatment tab if active
  useEffect(() => {
    if (formData.patientStatus === "A" && activeTab === "treatment") {
      setActiveTab("basic");
    }
  }, [formData.patientStatus, activeTab]);

  const isGeneralTabValid =
    formData.noGeneralRecommendations ||
    (formData.food?.trim() ?? "").length > 0 ||
    (formData.water?.trim() ?? "").length > 0 ||
    (formData.ointments?.trim() ?? "").length > 0;

  const { data: scheduleSettings } = useScheduleSettings();
  const hasTreatmentRecommendations =
    (formData.recommendations.physiotherapy?.treatments.length ?? 0) > 0 ||
    (formData.recommendations.tens?.treatments.length ?? 0) > 0;
  const hasInvalidDates = hasInvalidTreatmentStartDates(
    scheduleSettings,
    formData.recommendations.physiotherapy?.treatments,
    formData.recommendations.tens?.treatments,
  );
  const isTreatmentTabValid =
    formData.patientStatus === "A" ||
    formData.noTreatmentRecommendations ||
    (hasTreatmentRecommendations && !hasInvalidDates);

  const tabs = [
    {
      id: "basic",
      label: "Basic Information",
      isValid: Boolean(formData.mainConcern.trim()),
    },
    {
      id: "general",
      label: "General Recommendations",
      isValid: isGeneralTabValid,
    },
    {
      id: "treatment",
      label: "Automatic Scheduling",
      isValid: isTreatmentTabValid,
      disabled: formData.patientStatus === "A", // Not applicable for treatment discharge
      disabledTitle: "Unavailable for treatment discharge",
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Handle confirmation acknowledgment
  const handleConfirmationAcknowledge = () => {
    resetConfirmation();
    handleCancel(); // Close modal after acknowledgment
  };

  // Handle error acknowledgment
  const handleErrorContinue = () => {
    resetErrors();
    handleCancel(); // Close modal after acknowledgment
  };

  // Handle error retry
  const handleErrorRetry = () => {
    retryTreatmentCreation();
    // The retry logic would depend on the specific implementation
    // For now, we'll just reset the error state
  };

  // When treatment discharge (A) is selected, set return weeks to 0 in both
  // top-level and recommendations so the UI and submit logic both see 0
  const handleBasicInfoFormDataChange = useCallback(
    (field: keyof PostConsultationFormData, value: string | number | Date) => {
      if (field === "patientStatus" && value === "A") {
        setFormData((prev) => ({
          ...prev,
          patientStatus: "A",
          returnWeeks: 0,
          recommendations: {
            ...prev.recommendations,
            returnWeeks: 0,
            returnWhenTreatmentComplete: false,
          },
        }));
        return;
      }
      const syntheticEvent = {
        target: { name: field, value },
      } as React.ChangeEvent<HTMLInputElement>;
      handleChange(syntheticEvent);
    },
    [handleChange, setFormData],
  );

  // Auto-scroll to top on error
  useEffect(() => {
    if (error || fetchError) {
      const modalContent = document.querySelector(
        ".flex-1.bg-white.px-6.py-6.overflow-y-auto",
      );
      if (modalContent) {
        modalContent.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [error, fetchError]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <BasicInfoTab
            formData={formData}
            currentTreatmentStatus={
              currentTreatmentStatus as PatientStatusValue
            }
            patientData={patientData}
            onFormDataChange={handleBasicInfoFormDataChange}
            onDateChange={handleDateChange}
          />
        );
      case "general":
        return (
          <GeneralRecommendationsTab
            formData={formData}
            onFormDataChange={(field, value) => {
              const isCheckbox = typeof value === "boolean";
              const syntheticEvent = {
                target: isCheckbox
                  ? { name: field, type: "checkbox" as const, checked: value }
                  : { name: field, value },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleChange(syntheticEvent);
            }}
          />
        );
      case "treatment":
        return (
          <TreatmentRecommendationsTab
            formData={formData}
            onRecommendationsChange={handleRecommendationsChange}
            onFormDataChange={(field, value) => {
              const isCheckbox = typeof value === "boolean";
              const syntheticEvent = {
                target: isCheckbox
                  ? { name: field, type: "checkbox" as const, checked: value }
                  : { name: field, value },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleChange(syntheticEvent);
            }}
            treatmentStartDate={formData.startDate}
          />
        );
      default:
        return null;
    }
  };

  const actions = (
    <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
      <Button
        type="button"
        variant="outline"
        onClick={() => closeModal("postAttendance")}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button
        type="button"
        data-testid="loading-button"
        onClick={handleSubmit}
        isLoading={isLoading}
        disabled={
          isLoading ||
          !formData.mainConcern.trim() ||
          !isGeneralTabValid ||
          !isTreatmentTabValid
        }
        loadingText="Saving..."
      >
        Complete appointment
      </Button>
    </div>
  );

  // Don't render if modal is not open
  if (!postAttendance.isOpen || !postAttendance.attendanceId) {
    return null;
  }

  return (
    <TabbedModal
      isOpen={true}
      onClose={handleCancel}
      title={
        showConfirmation
          ? `Consultation Completed - ${patientName}`
          : showErrors
            ? `Problems with Treatment - ${patientName}`
            : `Assessment Consultation Form - ${patientName}`
      }
      subtitle={
        showConfirmation
          ? "Appointments created automatically"
          : showErrors
            ? "Some appointments could not be created"
            : `Attendance #${attendanceId} • Patient #${patientId}`
      }
      tabs={showConfirmation || showErrors ? [] : tabs} // Hide tabs in confirmation/error view
      activeTab={activeTab}
      onTabChange={handleTabChange}
      actions={showConfirmation || showErrors ? null : actions} // Hide actions in confirmation/error view
      maxWidth="6xl"
    >
      {/* Only show errors when not in confirmation or error mode */}
      {!showConfirmation && !showErrors && error && (
        <ErrorDisplay
          error={error}
          dismissible={true}
          onDismiss={clearError}
          className="mb-4"
        />
      )}

      {!showConfirmation && !showErrors && fetchError && (
        <ErrorDisplay
          error={fetchError}
          dismissible={true}
          onDismiss={setFetchError}
          className="mb-4"
        />
      )}

      {/* Render confirmation, errors, or form content */}
      {showConfirmation ? (
        <CreatedTreatmentsConfirmation
          createdTreatments={createdTreatments}
          patientName={patientName || ""}
          onAcknowledge={handleConfirmationAcknowledge}
          returnWeeks={formData.returnWeeks}
          returnWhenTreatmentComplete={
            formData.recommendations.returnWhenTreatmentComplete
          }
          newlyScheduledAttendances={newlyScheduledAttendances}
          fetchingAttendances={fetchingAttendances}
          attendancesError={attendancesError?.message}
          patientStatus={formData.patientStatus}
          cancelledAttendances={cancelledAttendances}
        />
      ) : showErrors ? (
        <TreatmentCreationErrors
          errors={treatmentCreationErrors}
          patientName={patientName || ""}
          onRetry={handleErrorRetry}
          onContinue={handleErrorContinue}
        />
      ) : (
        renderTabContent()
      )}
    </TabbedModal>
  );
};

export default PostAttendanceModal;
