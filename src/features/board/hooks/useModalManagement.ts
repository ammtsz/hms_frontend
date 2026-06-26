import { useState, useCallback } from "react";
import { useCreateConsultation } from "@/api/query/hooks/useConsultationQueries";
import { useUpdatePatient } from "@/api/query/hooks/usePatientQueries";
import type { CreateConsultationRequest, PatientStatus } from "@/api/types";
import type { PostConsultationFormData } from "../components/Consultation";

export interface ModalManagementState {
  // Patient edit modal
  editPatientModalOpen: boolean;
  patientToEdit: { id: string; name: string } | null;
  
  // Treatment form modal
  treatmentFormOpen: boolean;
  selectedAppointmentForTreatment: {
    id: number;
    patientId: number;
    patientName: string;
    appointmentType: string;
    currentTreatmentStatus: "N" | "T" | "D" | "C";
    currentStartDate?: Date;
    currentReturnWeeks?: number;
    isFirstAppointment: boolean;
  } | null;
}

interface UseModalManagementProps {
  refreshData?: () => void;
}

export const useModalManagement = ({
  refreshData,
}: UseModalManagementProps = {}) => {
  // React Query mutation hooks
  const createConsultationMutation = useCreateConsultation();
  const updatePatientMutation = useUpdatePatient();

  // Patient edit modal state
  const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Treatment form modal state (for when completing appointment)
  const [treatmentFormOpen, setTreatmentFormOpen] = useState(false);
  const [selectedAppointmentForTreatment, setSelectedAppointmentForTreatment] =
    useState<{
      id: number;
      patientId: number;
      patientName: string;
      appointmentType: string;
      currentTreatmentStatus: "N" | "T" | "D" | "C";
      currentStartDate?: Date;
      currentReturnWeeks?: number;
      isFirstAppointment: boolean;
    } | null>(null);

  // Patient edit modal handlers
  const handleEditPatientCancel = useCallback(() => {
    setEditPatientModalOpen(false);
    setPatientToEdit(null);
  }, []);

  const handleEditPatientSuccess = useCallback(() => {
    setEditPatientModalOpen(false);
    setPatientToEdit(null);
    // Refresh current date to show updated data
    refreshData?.();
  }, [refreshData]);

  const openEditPatientModal = useCallback(
    (patient: { id: string; name: string }) => {
      setPatientToEdit(patient);
      setEditPatientModalOpen(true);
    },
    []
  );

  // Treatment form modal handlers
  const handleTreatmentFormCancel = useCallback(() => {
    setTreatmentFormOpen(false);
    setSelectedAppointmentForTreatment(null);
  }, []);

  const openTreatmentFormModal = useCallback(
    (appointmentDetails: {
      id: number;
      patientId: number;
      patientName: string;
      appointmentType: string;
      currentTreatmentStatus: "N" | "T" | "D" | "C";
      currentStartDate?: Date;
      currentReturnWeeks?: number;
      isFirstAppointment: boolean;
    }) => {
      setSelectedAppointmentForTreatment(appointmentDetails);
      setTreatmentFormOpen(true);
    },
    []
  );

  const handleTreatmentFormSubmit = useCallback(
    async (data: PostConsultationFormData): Promise<{ consultationId: number }> => {
      if (!selectedAppointmentForTreatment) {
        throw new Error("No appointment selected for treatment");
      }

      try {
        // Build the create-consultation request
        const consultationRequest: CreateConsultationRequest = {
          appointmentId: selectedAppointmentForTreatment.id,
          mainConcern: data.mainConcern,
          patientStatus: data.patientStatus,
          homeExercises: data.homeExercises,
          painManagement: data.painManagement,
          medications: data.medications,
          returnWeeks: data.returnWeeks,
          notes: data.notes,
          // Legacy physiotherapy/tens flags
          physiotherapy: data.recommendations.physiotherapy?.treatments && data.recommendations.physiotherapy.treatments.length > 0,
          tens: data.recommendations.tens?.treatments && data.recommendations.tens.treatments.length > 0,
        };

        // Create the consultation using React Query mutation
        // The mutation automatically handles cache invalidation
        const response = await createConsultationMutation.mutateAsync(consultationRequest);

        if (!response?.consultation?.id) {
          throw new Error("Failed to create consultation: ID not returned");
        }

        // Update patient treatment status and discharge date if applicable
        if (data.patientStatus === 'D') {
          try {
            await updatePatientMutation.mutateAsync({
              patientId: selectedAppointmentForTreatment.patientId.toString(),
              data: {
                patientStatus: data.patientStatus as PatientStatus
              }
            });
            // React Query automatically invalidates patient queries
          } catch (patientUpdateError) {
            console.error("Failed to update patient treatment status:", patientUpdateError);
            // Don't throw: consultation was saved successfully despite patient update failing
          }
        }

        // Close modal and refresh data
        setTreatmentFormOpen(false);
        setSelectedAppointmentForTreatment(null);
        refreshData?.();

        return { consultationId: response.consultation.id };
      } catch (error) {
        console.error("Error creating consultation:", error);
        throw error;
      }
    },
    [selectedAppointmentForTreatment, refreshData, createConsultationMutation, updatePatientMutation]
  );

  return {
    // State
    editPatientModalOpen,
    patientToEdit,
    treatmentFormOpen,
    selectedAppointmentForTreatment,

    // Patient edit modal handlers
    handleEditPatientCancel,
    handleEditPatientSuccess,
    openEditPatientModal,

    // Treatment form modal handlers
    handleTreatmentFormCancel,
    handleTreatmentFormSubmit,
    openTreatmentFormModal,
  };
};

export default useModalManagement;
