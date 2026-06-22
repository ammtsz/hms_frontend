import { useState, useEffect, useMemo } from "react";
import { useUpdatePatient, useDeletePatient, usePatients } from "@/api/query/hooks/usePatientQueries";
import { transformPriorityToApi, transformStatusToApi } from "@/utils/apiTransformers";
import { formatPhoneNumber } from "@/utils/formUtils";
import type { UpdatePatientRequest, PatientResponseDto } from "@/api/types";
import { checkForDuplicatePatients } from "@/features/patients/edit/utils/duplicateDetection";
import { formatDisplayDate } from "@/utils/dateUtils";

export interface EditPatientFormData {
  name: string;
  phone: string;
  birthDate: string | null; // YYYY-MM-DD format
  priority: string;
  status: string;
  mainConcern: string;
  dischargeDate: string | null; // YYYY-MM-DD format
  nextAttendanceDates: { date: string; type: string }[]; // dates as YYYY-MM-DD strings
}

/** Shown when user tries to change status to A or F and there are open attendances to cancel */
export interface PendingStatusChange {
  newStatus: "A" | "F";
  openCount: number;
}

interface UseEditPatientFormProps {
  patientId: string;
  initialData: EditPatientFormData;
  /** YYYY-MM-DD: discharge date cannot be earlier than this (e.g. last completed attendance date) */
  minDischargeDate?: string | null;
  /** Count of open (scheduled/checked_in/in_progress) attendances; used to confirm status change to A or F */
  openAttendancesCount?: number;
  onClose: () => void;
  onSuccess?: (updatedPatient: PatientResponseDto) => void;
  onDeleteSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useEditPatientForm = ({
  patientId,
  initialData,
  minDischargeDate = null,
  openAttendancesCount = 0,
  onClose,
  onSuccess,
  onDeleteSuccess,
  onError,
}: UseEditPatientFormProps) => {
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();
  const { data: allPatients, refetch: refetchPatients } = usePatients();
  
  const [patient, setPatient] = useState<EditPatientFormData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<EditPatientFormData>(initialData);
  const [duplicatePatients, setDuplicatePatients] = useState<Array<{ id: string; name: string; phone: string; priority: string; status: string }>>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);

  // Store serialized version of initialData to detect real changes
  const initialDataString = JSON.stringify(initialData);

  // Update form when initialData changes (e.g., when patient data loads)
  useEffect(() => {
    setInitialFormData(initialData);
    setPatient(initialData);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDataString]); // Use stringified version to detect actual data changes

  // Check if form has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(initialFormData) !== JSON.stringify(patient);
  }, [patient, initialFormData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "date") {
      // Keep date as YYYY-MM-DD string format, not Date object
      const dateValue = value || null;
      setPatient(prev => ({ ...prev, [name]: dateValue }));
      return;
    }

    // Format phone number as user types
    if (name === "phone") {
      const formatted = formatPhoneNumber(value);
      setPatient(prev => ({ ...prev, [name]: formatted }));
      return;
    }

    setPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleAssessmentConsultationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "dischargeDate") {
      setPatient((prev) => ({
        ...prev,
        dischargeDate: value || null, // Keep as YYYY-MM-DD string
      }));
    } else if (name === "firstConsultationDate") {
      const date = value || null; // Keep as YYYY-MM-DD string
      setPatient((prev) => ({
        ...prev,
        nextAttendanceDates: date 
          ? [{ date, type: "assessment" }]
          : [],
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!patient.name.trim()) {
      setError("Name is required");
      return false;
    }

    if (!patient.birthDate) {
      setError("Birth date is required");
      return false;
    }

    // Validate phone format if provided
    if (patient.phone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(patient.phone)) {
      setError("Phone must be in format (XX) XXXXX-XXXX");
      return false;
    }

    // Discharge date cannot be earlier than last completed attendance
    if (
      patient.dischargeDate &&
      minDischargeDate &&
      patient.dischargeDate < minDischargeDate
    ) {
      setError(        
        `The discharge date cannot be earlier than the date of the last completed attendance (${formatDisplayDate(minDischargeDate)}).`,
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    e: React.FormEvent,
    skipDuplicateCheck = false,
    skipStatusChangeConfirm = false,
  ) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    // When changing to Discharged (A) or Missed (F), confirm cancellation of open attendances
    if (
      !skipStatusChangeConfirm &&
      (patient.status === "A" || patient.status === "F") &&
      openAttendancesCount > 0
    ) {
      setPendingStatusChange({
        newStatus: patient.status as "A" | "F",
        openCount: openAttendancesCount,
      });
      return;
    }

    // Check for duplicates before saving (unless explicitly skipped)
    if (!skipDuplicateCheck) {
      const { data: latestPatients } = await refetchPatients();
      const patientsToCheck = latestPatients || allPatients;

      if (patientsToCheck && patient.name) {
        const duplicates = checkForDuplicatePatients(
          patientsToCheck,
          patient.name,
          patient.phone || "",
          patientId,
        );

        if (duplicates.length > 0) {
          setDuplicatePatients(duplicates);
          setShowDuplicateModal(true);
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      // Transform data to match API format
      const updateData: UpdatePatientRequest = {
        name: patient.name.trim(),
        priority: transformPriorityToApi(patient.priority as "1" | "2" | "3"),
        patientStatus: transformStatusToApi(patient.status as "N" | "T" | "A" | "F"),
        mainConcern: patient.mainConcern.trim() || undefined,
      };

      // Only include phone if it's provided and properly formatted
      if (patient.phone && patient.phone.length > 0) {
        updateData.phone = patient.phone;
      }

      // Only include birth date if it's valid (already YYYY-MM-DD format)
      if (patient.birthDate) {
        updateData.birthDate = patient.birthDate;
      }

      // Include discharge date (optional; null clears it on backend when supported)
      updateData.dischargeDate = patient.dischargeDate ?? undefined;

      // Use React Query mutation
      const result = await updatePatientMutation.mutateAsync({
        patientId,
        data: updateData
      });

      // Update initial form data to prevent unsaved changes detection
      setInitialFormData(patient);

      // Call success callback if provided
      if (onSuccess && result) {
        onSuccess(result);
      }

      onClose();
    } catch (err) {
      console.error("Error updating patient:", err);
      const errorMessage = "Internal server error";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save anyway after duplicate warning (skip both duplicate check and status
  // change confirmation to avoid re-opening ConfirmStatusChangeModal)
  const handleSaveAnyway = async () => {
    setShowDuplicateModal(false);
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent;
    await handleSubmit(syntheticEvent, true, true);
  };

  const confirmStatusChange = () => {
    setPendingStatusChange(null);
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent;
    void handleSubmit(syntheticEvent, false, true);
  };

  const cancelStatusChange = () => {
    setPendingStatusChange(null);
  };

  // Handle delete patient
  const handleDelete = async () => {
    try {
      await deletePatientMutation.mutateAsync(patientId);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      console.error("Error deleting patient:", err);
      
      // Parse error message for specific cases
      const errorMessage = err instanceof Error ? err.message : "Error deleting patient";
      
      let friendlyError = errorMessage;
      if (
        errorMessage.toLowerCase().includes("active attendances") ||
        (errorMessage.toLowerCase().includes("cannot delete patient") &&
          errorMessage.toLowerCase().includes("attendances"))
      ) {
        friendlyError =
          "It is not possible to delete this patient because he has ongoing or completed appointments. " +
          "Deletion is only allowed for patients without appointment history or with only canceled or missed appointments.";
      }
      
      setError(friendlyError);
      if (onError) {
        onError(friendlyError);
      }
      throw err;
    }
  };

  // Reset unsaved changes (useful when user chooses to leave without saving)
  const resetUnsavedChanges = () => {
    setInitialFormData(patient);
  };

  return {
    patient,
    handleChange,
    handleAssessmentConsultationChange,
    handleSubmit,
    handleSaveAnyway,
    handleDelete,
    isLoading,
    isDeleting: deletePatientMutation.isPending,
    error,
    setError,
    hasUnsavedChanges,
    duplicatePatients,
    showDuplicateModal,
    setShowDuplicateModal,
    resetUnsavedChanges,
    pendingStatusChange,
    confirmStatusChange,
    cancelStatusChange,
  };
};
