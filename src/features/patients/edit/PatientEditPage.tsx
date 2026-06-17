"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/common/Breadcrumb";
import PatientFormFields from "@/features/patients/form/PatientFormFields";
import { usePatientWithAttendances } from "@/api/query/hooks/usePatientQueries";
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
  } = usePatientWithAttendances(patientId);

  // Transform patient data when it's available
  const initialData = useMemo(() => {
    if (patient) {
      return {
        name: patient.name,
        phone: patient.phone || "",
        birthDate: patient.birthDate || null,
        priority: patient.priority,
        status: patient.status,
        mainComplaint: patient.mainComplaint || "",
        dischargeDate: patient.dischargeDate || null,
        nextAttendanceDates: [],
      };
    }
    return null;
  }, [patient]);

  // Last completed attendance date (previousAttendances sorted by date desc)
  const minDischargeDate = patient?.previousAttendances?.[0]?.date ?? null;
  const hasKnownAttendanceHistory =
    (patient?.previousAttendances?.length ?? 0) > 0 ||
    (patient?.openAttendancesCount ?? 0) > 0;

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
      mainComplaint: "",
      dischargeDate: null,
      nextAttendanceDates: [],
    },
    minDischargeDate,
    openAttendancesCount: patient?.openAttendancesCount ?? 0,
    onClose: () => {
      showToast("Paciente atualizado com sucesso!", "success", 5000);
      router.push(`/patients/${patientId}`);
    },
    onDeleteSuccess: () => {
      setShowDeleteModal(false);
      showToast("Paciente excluído com sucesso!", "success", 5000);
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
              { label: "Pacientes", href: "/patients" },
              { label: "Carregando...", isActive: true },
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
              { label: "Pacientes", href: "/patients" },
              { label: "Erro", isActive: true },
            ]}
          />
          <PageError
            error={error?.message || "Paciente não encontrado"}
            reset={refetch}
            title="Erro ao carregar paciente"
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
              { label: "Pacientes", href: "/patients" },
              { label: patient.name, href: `/patients/${patientId}` },
              { label: "Editar", isActive: true },
            ]}
          />

          {/* Page Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Editar Paciente: {patient.name}
              </h1>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="w-full border-red-500 text-red-600 hover:border-red-700 hover:text-red-700 sm:w-auto"
                disabled={isSaving || isDeleting || hasKnownAttendanceHistory}
                title={
                  hasKnownAttendanceHistory
                    ? "É permitida a exclusão apenas de pacientes sem histórico de atendimento ou com apenas atendimentos cancelados ou perdidos."
                    : undefined
                }
              >
                Excluir
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Registro #{patientId}</p>
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
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Informações Básicas</h2>
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
                    hasCompletedAttendances:
                      (patient.previousAttendances?.length ?? 0) > 0,
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
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSaving}
                    loadingText="Salvando..."
                    className="flex-1 sm:flex-none"
                  >
                    Salvar Alterações
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

      {/* Confirm status change (Alta/Faltas) – cancels open attendances */}
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
