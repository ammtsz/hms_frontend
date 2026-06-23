"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/common/Breadcrumb";
import PatientFormFields from "@/features/patients/form/PatientFormFields";
import { usePatientWithAppointments } from "@/api/query/hooks/usePatientQueries";
import { useEditPatientForm } from "@/features/patients/form/hooks/useEditPatientForm";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { PageError } from "@/components/common/PageError";
import { PatientDetailSkeleton } from "@/features/patients/detail/PatientDetailSkeleton";
import DeletePatientModal from "./DeletePatientModal";
import DuplicateWarningModal from "./DuplicateWarningModal";
import UnsavedChangesModal from "./UnsavedChangesModal";
import ConfirmStatusChangeModal from "./ConfirmStatusChangeModal";
import { useToast } from "@/contexts/ToastContext";
import { useUnsavedGuard } from "@/features/patients/edit/hooks/useUnsavedGuard";
import { Button, Card, CardBody } from "@/components/ui";

interface PatientEditPageProps {
  patientId: string;
}

const PatientEditPage: React.FC<PatientEditPageProps> = ({ patientId }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  // Fetch patient data
  const {
    data: patient,
    isLoading,
    error,
    refetch,
  } = usePatientWithAppointments(patientId);

  // Transform patient data when it's available
  const initialData = useMemo(() => {
    if (patient) {
      return {
        name: patient.name,
        phone: patient.phone || "",
        birthDate: patient.birthDate || null,
        priority: patient.priority,
        status: patient.status,
        mainConcern: patient.mainConcern || "",
        dischargeDate: patient.dischargeDate || null,
        nextAppointmentDates: [],
      };
    }
    return null;
  }, [patient]);

  // Last completed appointment date (previousAppointments sorted by date desc)
  const minDischargeDate = patient?.previousAppointments?.[0]?.date ?? null;
  const hasKnownAppointmentHistory =
    (patient?.previousAppointments?.length ?? 0) > 0 ||
    (patient?.openAppointmentsCount ?? 0) > 0;

  // Form hook with business logic
  const {
    patient: formPatient,
    handleChange,
    handleAssessmentConsultationChange,
    handleSubmit,
    handleSaveAnyway,
    handleDelete,
    isLoading: isSaving,
    isDeleting,
    error: formError,
    setError,
    hasUnsavedChanges,
    duplicatePatients,
    showDuplicateModal,
    setShowDuplicateModal,
    resetUnsavedChanges,
    pendingStatusChange,
    confirmStatusChange,
    cancelStatusChange,
  } = useEditPatientForm({
    patientId,
    initialData: initialData || {
      name: "",
      phone: "",
      birthDate: null,
      priority: "3",
      status: "T",
      mainConcern: "",
      dischargeDate: null,
      nextAppointmentDates: [],
    },
    minDischargeDate,
    openAppointmentsCount: patient?.openAppointmentsCount ?? 0,
    onClose: () => {
      showToast("Patient updated successfully!", "success", 5000);
      router.push(`/patients/${patientId}`);
    },
    onDeleteSuccess: () => {
      setShowDeleteModal(false);
      showToast("Patient deleted successfully!", "success", 5000);
      router.push("/patients");
    },
    onError: (error) => {
      showToast(error, "error", 7000);
    },
  });

  // Focus discharge date field when redirected from TreatmentStatusOverview card
  useEffect(() => {
    if (
      isLoading ||
      !patient ||
      searchParams.get("focus") !== "dischargeDate"
    ) {
      return;
    }
    const field = document.getElementById("dischargeDate");
    if (field) {
      field.scrollIntoView({ behavior: "smooth", block: "center" });
      (field as HTMLInputElement).focus?.();
    }
    router.replace(`/patients/${patientId}/edit`, { scroll: false });
  }, [isLoading, patient, patientId, router, searchParams]);

  // Unsaved changes guard hook
  const {
    showModal: showUnsavedModal,
    confirmLeave,
    cancelLeave,
  } = useUnsavedGuard({
    isDirty: hasUnsavedChanges,
  });

  // Handle delete with modal management
  const handleDeletePatient = async () => {
    try {
      await handleDelete();
    } catch {
      // Error already handled in the hook
      setShowDeleteModal(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(`/patients/${patientId}`);
      return;
    }
    router.push(`/patients/${patientId}`);
  };

  // Handle leaving without saving (from unsaved changes modal)
  const handleLeaveWithoutSaving = () => {
    // Reset unsaved changes state to allow navigation
    resetUnsavedChanges();

    if (pendingNavigation) {
      // Handle cancel button flow
      router.push(pendingNavigation);
      setPendingNavigation(null);
    } else {
      // Handle browser back button flow
      confirmLeave();
    }
  };

  // Handle staying on page (from unsaved changes modal)
  const handleStayOnPage = () => {
    setPendingNavigation(null);
    cancelLeave();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumb
            items={[
              { label: "Patients", href: "/patients" },
              { label: "Loading...", isActive: true },
            ]}
          />
          <PatientDetailSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !patient) {
    return (
      <div className=" bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumb
            items={[
              { label: "Patients", href: "/patients" },
              { label: "Error", isActive: true },
            ]}
          />
          <PageError
            error={error?.message || "Patient not found"}
            reset={refetch}
            title="Error loading patient"
            showBackButton={true}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Patients", href: "/patients" },
              { label: patient.name, href: `/patients/${patientId}` },
              { label: "Edit", isActive: true },
            ]}
          />

          {/* Page Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Patient: {patient.name}
              </h1>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="w-full border-red-500 text-red-600 hover:border-red-700 hover:text-red-700 sm:w-auto"
                disabled={isSaving || isDeleting || hasKnownAppointmentHistory}
                title={
                  hasKnownAppointmentHistory
                    ? "Deletion is only allowed for patients without appointment history or with only canceled or missed appointments."
                    : undefined
                }
              >
                Delete
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-1">ID #{patientId}</p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              // Prevent Enter key from submitting the form unless it's the submit button
              if (e.key === "Enter" && e.target instanceof HTMLElement) {
                const isSubmitButton =
                  e.target.tagName === "BUTTON" &&
                  (e.target as HTMLButtonElement).type === "submit";

                if (!isSubmitButton) {
                  e.preventDefault();
                }
              }
            }}
            className="space-y-6"
          >
            {/* Error Display */}
            <ErrorDisplay
              error={formError}
              className="mb-4"
              dismissible={true}
              onDismiss={() => setError(null)}
            />

            <Card>
              <CardBody>
                {/* Basic Information Card */}
                <h2 className="mb-6 text-lg font-semibold text-gray-900">
                  Basic Information
                </h2>
                <PatientFormFields
                  patient={formPatient}
                  handleChange={handleChange}
                  handleAssessmentConsultationChange={
                    handleAssessmentConsultationChange
                  }
                  showAssessmentConsultation={false}
                  showDischargeDate={true}
                  statusConfig={{
                    currentStatus: patient.status,
                    hasCompletedAppointments:
                      (patient.previousAppointments?.length ?? 0) > 0,
                  }}
                  isEdit={true}
                />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 sm:flex-none"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSaving}
                    loadingText="Saving..."
                    className="flex-1 sm:flex-none"
                  >
                    Save Changes
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeletePatientModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePatient}
        patientName={patient.name}
        isDeleting={isDeleting}
      />

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onSaveAnyway={handleSaveAnyway}
        duplicatePatients={duplicatePatients}
        isSaving={isSaving}
      />

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal || pendingNavigation !== null}
        onLeave={handleLeaveWithoutSaving}
        onStay={handleStayOnPage}
      />

      {/* Confirm status change (Discharged (D) / Consecutive no-shows (C)) – cancels open appointments */}
      <ConfirmStatusChangeModal
        isOpen={pendingStatusChange !== null}
        onClose={cancelStatusChange}
        onConfirm={confirmStatusChange}
        pendingStatusChange={pendingStatusChange}
        isSaving={isSaving}
      />
    </>
  );
};

export default PatientEditPage;
