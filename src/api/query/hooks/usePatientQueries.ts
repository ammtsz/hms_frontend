import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatientById, updatePatient, getPatients, createPatient, deletePatient } from '@/api/patients';
import { getAppointmentsByPatient } from '@/api/appointments';
import {
  transformSinglePatientFromApi,
  transformPatientWithAppointments,
  transformPatientsFromApi
} from '@/utils/apiTransformers';
import { Patient } from '@/types/types';
import { UpdatePatientRequest, CreatePatientRequest } from '@/api/types';
import { getTodayClinic } from '@/utils/timezoneDate';
import { treatmentsQueryKeys } from '@/api/query/keys/treatmentsQueryKeys';
import { patientNotesKeys } from '@/api/query/keys/patientNotesKeys';
import { sessionsQueryKeys } from '@/api/query/keys/sessionsQueryKeys';
import { patientKeys } from '@/api/query/keys/patientKeys';

/**
 * Hook to fetch patient data with appointments
 * Implements parallel fetching with fallback strategy
 */
export function usePatientWithAppointments(patientId: string) {
  return useQuery({
    queryKey: patientKeys.detail(patientId),
    queryFn: async (): Promise<Patient> => {
      // Fetch patient data and appointment history in parallel
      const [patientResult, appointmentsResult] = await Promise.all([
        getPatientById(patientId),
        getAppointmentsByPatient(patientId),
      ]);

      if (!patientResult.success || !patientResult.value) {
        throw new Error(patientResult.error || 'Patient not found');
      }

      let transformedPatient: Patient;

      if (appointmentsResult.success && appointmentsResult.value) {
        // Use enhanced transformer with appointment history
        transformedPatient = transformPatientWithAppointments(
          patientResult.value,
          appointmentsResult.value
        );
      } else {
        // Fallback to basic transformer if appointment fetch fails
        transformedPatient = transformSinglePatientFromApi(patientResult.value);

        // Log appointment error but don't fail the query
        console.warn('Failed to load appointment data:', appointmentsResult.error);
      }

      return transformedPatient;
    },
    enabled: !!patientId,
    // Patient data is relatively stable, cache longer for better performance
    staleTime: 10 * 60 * 1000, // 10 minutes
    // Keep in cache for 30 minutes after last use
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to fetch only patient basic data (without appointments)
 * Useful for lighter queries when appointment data isn't needed
 */
export function usePatient(patientId: string) {
  return useQuery({
    queryKey: [...patientKeys.detail(patientId), 'basic'],
    queryFn: async (): Promise<Patient> => {
      const result = await getPatientById(patientId);

      if (!result.success || !result.value) {
        throw new Error(result.error || 'Patient not found');
      }

      return transformSinglePatientFromApi(result.value);
    },
    enabled: !!patientId,
    staleTime: 10 * 60 * 1000, // 10 minutes - patient data is stable
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch patient appointments separately
 * Allows for independent caching and refetching of appointment data
 */
export function usePatientAppointments(patientId: string) {
  return useQuery({
    queryKey: patientKeys.appointments(patientId),
    queryFn: async () => {
      const result = await getAppointmentsByPatient(patientId);

      if (!result.success) {
        throw new Error(result.error || 'Error loading appointments');
      }

      return result.value || [];
    },
    enabled: !!patientId,
    // Appointment data changes more frequently
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch newly scheduled appointments for a patient
 * Used for confirmation display after treatment creation
 * Filters for scheduled appointments from today onwards
 */
export function useNewlyScheduledAppointments(patientId: string | undefined, enabled: boolean = false) {
  const today = getTodayClinic();

  return useQuery({
    queryKey: [...patientKeys.appointments(patientId || ''), 'scheduled', today],
    queryFn: async () => {
      if (!patientId) {
        throw new Error('Patient ID is required');
      }

      const result = await getAppointmentsByPatient(patientId, {
        fromDate: today,
        status: 'scheduled'
      });

      if (!result.success) {
        throw new Error(result.error || 'Error loading scheduled appointments');
      }

      return result.value || [];
    },
    enabled: enabled && !!patientId,
    // This data is fresh and shouldn't be cached long
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Query hook for fetching all patients (replaces PatientsContext)
 * Provides automatic caching, background sync, and error handling
 */
export function usePatients() {
  return useQuery({
    queryKey: patientKeys.lists(),
    queryFn: async () => {
      const result = await getPatients();

      if (!result.success || !result.value) {
        throw new Error(result.error || 'Error loading patients');
      }

      // Transform API response to internal format
      return transformPatientsFromApi(result.value);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - patient list doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Mutation hook for creating new patients
 * Automatically invalidates patient list after successful creation
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePatientRequest) => {
      const result = await createPatient(data);

      if (!result.success) {
        throw new Error(result.error || 'Error creating patient');
      }

      return result.value;
    },
    onSuccess: () => {
      // Invalidate and refetch patient lists
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
    onError: (error) => {
      console.error('Error creating patient:', error);
    },
  });
}

/**
 * Mutation hook for updating patient data
 * Automatically invalidates relevant queries after successful update
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, data }: { patientId: string; data: UpdatePatientRequest }) => {
      const result = await updatePatient(patientId, data);

      if (!result.success) {
        throw new Error(result.error || 'Error updating patient');
      }

      return result.value;
    },
    onSuccess: (_, { patientId }) => {
      // Detail query (usePatientWithAppointments) and separate appointment cache
      // (ScheduledAppointmentsCard, AppointmentHistory) must both refresh — e.g. when
      // status D/C cancels open appointments on the backend.
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) });
      queryClient.invalidateQueries({ queryKey: patientKeys.appointments(patientId) });
      queryClient.invalidateQueries({ queryKey: patientNotesKeys.list(patientId) });
      queryClient.invalidateQueries({ queryKey: sessionsQueryKeys.byPatient(patientId) });
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: treatmentsQueryKeys.byPatient(patientId) });
    },
    onError: (error) => {
      console.error('Error updating patient:', error);
    },
  });
}

/**
 * Mutation hook for deleting patients
 * Automatically invalidates patient list after successful deletion
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      const result = await deletePatient(patientId);

      if (!result.success) {
        throw new Error(result.error || 'Error deleting patient');
      }

      return result.value;
    },
    onSuccess: () => {
      // Invalidate and refetch patient lists
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
    onError: (error) => {
      console.error('Error deleting patient:', error);
    },
  });
}

/**
 * Utility function to prefetch patient data
 * Useful for preloading data on hover or navigation anticipation
 */
export function usePrefetchPatient() {
  const queryClient = useQueryClient();

  return (patientId: string) => {
    queryClient.prefetchQuery({
      queryKey: patientKeys.detail(patientId),
      queryFn: async () => {
        const [patientResult, appointmentsResult] = await Promise.all([
          getPatientById(patientId),
          getAppointmentsByPatient(patientId),
        ]);

        if (!patientResult.success || !patientResult.value) {
          throw new Error(patientResult.error || 'Patient not found');
        }

        if (appointmentsResult.success && appointmentsResult.value) {
          return transformPatientWithAppointments(
            patientResult.value,
            appointmentsResult.value
          );
        } else {
          return transformSinglePatientFromApi(patientResult.value);
        }
      },
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate patient-related cache
 * Useful for manual cache refresh after external updates
 */
/**
 * Loads patient data for displaying main concern (e.g. expanded assessment card).
 */
export function usePatientComplaint(patientId: number | null) {
  const query = useQuery({
    queryKey: patientKeys.mainConcern(patientId ?? 0),
    queryFn: async () => {
      if (!patientId) return null;

      const result = await getPatientById(String(patientId));

      if (!result.success || !result.value) {
        return null;
      }

      return result.value;
    },
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  return {
    patient: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useInvalidatePatientCache() {
  const queryClient = useQueryClient();

  return {
    invalidatePatient: (patientId: string) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) });
    },
    invalidatePatientAppointments: (patientId: string) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.appointments(patientId) });
    },
    invalidatePatientNotes: (patientId: string) => {
      queryClient.invalidateQueries({ queryKey: patientNotesKeys.list(patientId) });
    },
    invalidatePatientSessions: (patientId: string) => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKeys.byPatient(patientId) });
    },
    invalidateAllPatients: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  };
}