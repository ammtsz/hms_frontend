/**
 * useBoardData - Consolidated data management hook
 * 
 * This hook combines and consolidates the scattered data management logic
 * from multiple hooks into a single, focused hook that handles:
 * - Appointment data fetching and state management
 * - Patient operations within appointment context
 * - Integration with React Query hooks and appointment UI state
 */

import { useState, useCallback } from "react";
import { useBoardState } from "@/features/board/hooks/useBoardState";
import { usePatients, useCreatePatient } from "@/api/query/hooks/usePatientQueries";
import { 
  useCreateAppointment, 
  useCheckInAppointment, 
  useDeleteAppointment 
} from "@/api/query/hooks/useAppointmentQueries";
import { 
  AppointmentStatusDetail,
  Priority,
  PatientBasic,
  AppointmentByDate 
} from "@/types/types";
import { AppointmentType } from "@/api/types";
import { validatePatientData, calculateAge } from "@/utils/patientUtils";
import { transformPriorityToApi } from "@/utils/apiTransformers";
import { sortPatientsByPriority } from "@/utils/businessRules";
import { useFetchDayFinalizationStatus } from "@/api/query/hooks/useDayFinalizationQueries";
import { getTodayClinic } from "@/utils/timezoneDate";

export interface UseAppointmentDataProps {
  onNewPatientDetected?: (patient: PatientBasic) => void;
  onCheckInProcessed?: () => void;
}

interface PatientCreationResult {
  success: boolean;
  patient?: PatientBasic;
  error?: string;
}

export interface UseAppointmentDataReturn {
  // Data state
  appointmentsByDate: AppointmentByDate | null;
  selectedDate: string;
  loading: boolean;
  error: string | null;
  
  // Patient data
  patients: PatientBasic[];
  
  // Actions
  createAppointment: (params: {
    patientId: number;
    appointmentType: AppointmentType;
    scheduledDate?: string;
  }) => Promise<boolean>;
  
  checkInAppointment: (params: {
    appointmentId: number;
    patientName: string;
  }) => Promise<boolean>;
  
  createPatient: (params: {
    name: string;
    phone?: string;
    priority: Priority;
    birthDate: string;
    mainConcern?: string;
  }) => Promise<PatientCreationResult>;
  
  deleteAppointment: (appointmentId: number, cancellationReason?: string) => Promise<boolean>;
  
  refreshData: () => Promise<void>;
  
  // Utility functions
  getIncompleteAppointments: () => AppointmentStatusDetail[];
  getScheduledAbsences: () => AppointmentStatusDetail[];
  getSortedPatients: () => PatientBasic[];
}

export const useBoardData = ({
  onNewPatientDetected,
  onCheckInProcessed
}: UseAppointmentDataProps = {}): UseAppointmentDataReturn => {
  
  // Local state
  const [processingAppointment, setProcessingAppointment] = useState(false);
  const fetchDayFinalizationStatus = useFetchDayFinalizationStatus();
  
  // Hybrid hooks (React Query + Zustand)
  const {
    appointmentsByDate,
    selectedDate,
    loading: appointmentsLoading,
    error: appointmentsError,
    refreshCurrentDate
  } = useBoardState();
  
  const {
    data: patients = [],
    isLoading: patientsLoading,
    error: patientsError
  } = usePatients();

  // React Query mutations for better cache management
  const createAppointmentMutation = useCreateAppointment();
  const checkInAppointmentMutation = useCheckInAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();
  const createPatientMutation = useCreatePatient();

  // Consolidated loading and error states
  const loading = appointmentsLoading || patientsLoading || processingAppointment;
  const error = appointmentsError || (patientsError ? (patientsError as Error).message : null);

  /**
   * Create a new appointment
   */
  // TO DO: Check where it is being used
  const createAppointment = useCallback(async (params: {
    patientId: number;
    appointmentType: AppointmentType;
    scheduledDate?: string;
  }) => {
    try {
      const dateToSchedule = params.scheduledDate ?? selectedDate ?? getTodayClinic();
      const finalizationStatus = await fetchDayFinalizationStatus(dateToSchedule);
      if (
        finalizationStatus.success &&
        finalizationStatus.value?.isFinalized
      ) {
        console.error("Cannot schedule: day is finalized.");
        return false;
      }

      setProcessingAppointment(true);
      
      await createAppointmentMutation.mutateAsync({
        patientId: params.patientId,
        appointmentType: params.appointmentType,
        scheduledDate: params.scheduledDate
      });

      await refreshCurrentDate();
      onCheckInProcessed?.();
      return true;
    } catch (error) {
      console.error("Error creating appointment:", error);
      return false;
    } finally {
      setProcessingAppointment(false);
    }
  }, [refreshCurrentDate, onCheckInProcessed, createAppointmentMutation, fetchDayFinalizationStatus, selectedDate]);

  /**
   * Check in a patient for their appointment
   */
  const checkInAppointment = useCallback(async (params: {
    appointmentId: number;
    patientName: string;
  }) => {
    try {
      setProcessingAppointment(true);
      
      await checkInAppointmentMutation.mutateAsync({
        appointmentId: params.appointmentId,
        patientName: params.patientName
      });

      await refreshCurrentDate();
      return true;
    } catch (error) {
      console.error("Error checking in:", error);
      return false;
    } finally {
      setProcessingAppointment(false);
    }
  }, [refreshCurrentDate, checkInAppointmentMutation]);

  /**
   * Create a new patient
   */
  const createPatient = useCallback(async (params: {
    name: string;
    phone?: string;
    priority: Priority;
    birthDate: string;
    mainConcern?: string;
  }) => {
    try {
      setProcessingAppointment(true);
      
      // Validate patient data
      const validation = validatePatientData({
        name: params.name,
        phone: params.phone,
        birthDate: params.birthDate
      });

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", ")
        };
      }

      const newPatientData = await createPatientMutation.mutateAsync({
        name: params.name.trim(),
        phone: params.phone?.trim() || undefined,
        priority: transformPriorityToApi(params.priority),
        birthDate: params.birthDate, // Already in YYYY-MM-DD format
        mainConcern: params.mainConcern?.trim() || undefined,
      });

      // React Query automatically refreshes patient lists, no manual refresh needed
      
      // Trigger new patient detection if callback provided
      if (onNewPatientDetected && newPatientData) {
        const newPatient = {
          id: newPatientData.id.toString(),
          name: newPatientData.name,
          phone: newPatientData.phone || "",
          priority: params.priority,
          status: "T", // Default status
          age: calculateAge(params.birthDate),
          appointmentType: "assessment" as AppointmentType,
          missingAppointmentsStreak: 0
        } as PatientBasic;
        
        onNewPatientDetected(newPatient);
      }
      
      return {
        success: true,
        patient: newPatientData ? {
          id: newPatientData.id.toString(),
          name: newPatientData.name,
          phone: newPatientData.phone || "",
          priority: params.priority,
          status: "T",
          age: calculateAge(params.birthDate),
          appointmentType: "assessment" as AppointmentType,
          missingAppointmentsStreak: 0
        } as PatientBasic : undefined
      };
    } catch (error) {
      console.error("Error creating patient:", error);
      return {
        success: false,
        error: "An unexpected error occurred while creating the patient"
      };
    } finally {
      setProcessingAppointment(false);
    }
  }, [createPatientMutation, onNewPatientDetected]);

  /**
   * Delete an appointment with optional cancellation reason
   */
  const deleteAppointment = useCallback(async (appointmentId: number, cancellationReason?: string) => {
    try {
      setProcessingAppointment(true);
      
      await deleteAppointmentMutation.mutateAsync({ appointmentId, cancellationReason });

      await refreshCurrentDate();
      return true;
    } catch (error) {
      console.error("Error deleting appointment:", error);
      return false;
    } finally {
      setProcessingAppointment(false);
    }
  }, [refreshCurrentDate, deleteAppointmentMutation]);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    // React Query automatically refreshes patient lists, only refresh appointments
    await refreshCurrentDate();
  }, [refreshCurrentDate]);

  /**
   * Get incomplete appointments from current data
   */
  const getIncompleteAppointments = useCallback((): AppointmentStatusDetail[] => {
    if (!appointmentsByDate) return [];

    const incomplete: AppointmentStatusDetail[] = [];
    ["assessment", "physiotherapy", "tens"].forEach((type) => {
      ["checkedIn", "onGoing"].forEach((status) => {
        const typeData = appointmentsByDate[type as keyof typeof appointmentsByDate];
        if (typeData && typeof typeData === "object") {
          const statusData = typeData[status as keyof typeof typeData];
          if (Array.isArray(statusData)) {
            incomplete.push(...(statusData as AppointmentStatusDetail[]));
          }
        }
      });
    });

    return incomplete;
  }, [appointmentsByDate]);

  /**
   * Get scheduled absences from current data
   */
  const getScheduledAbsences = useCallback((): AppointmentStatusDetail[] => {
    if (!appointmentsByDate) return [];

    const scheduled: AppointmentStatusDetail[] = [];
    ["assessment", "physiotherapy", "tens"].forEach((type) => {
      const typeData = appointmentsByDate[type as keyof typeof appointmentsByDate];
      if (typeData && typeof typeData === "object" && "scheduled" in typeData) {
        const scheduledData = typeData.scheduled;
        if (Array.isArray(scheduledData)) {
          scheduled.push(...(scheduledData as AppointmentStatusDetail[]));
        }
      }
    });

    return scheduled;
  }, [appointmentsByDate]);

  /**
   * Get patients sorted by priority
   */
  const getSortedPatients = useCallback((): PatientBasic[] => {
    return sortPatientsByPriority(patients);
  }, [patients]);

  return {
    // Data state
    appointmentsByDate,
    selectedDate,
    loading,
    error,
    patients,
    
    // Actions
    createAppointment,
    checkInAppointment,
    createPatient,
    deleteAppointment,
    refreshData,
    
    // Utility functions
    getIncompleteAppointments,
    getScheduledAbsences,
    getSortedPatients
  };
};

export default useBoardData;
