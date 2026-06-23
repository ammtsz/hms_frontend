import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConsultations,
  getConsultationByAppointment,
  getLatestConsultationByPatient,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  scheduleReturnAppointment,
} from '@/api/consultations';
import type {
  ConsultationResponseDto,
  CreateConsultationRequest,
  UpdateConsultationRequest,
  UpdateConsultationResponseDto,
} from '@/api/types';

import { consultationKeys } from '@/api/query/keys/consultationKeys';

export function useConsultations() {
  return useQuery({
    queryKey: consultationKeys.lists(),
    queryFn: async () => {
      const result = await getConsultations();

      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to load consultations');
      }

      return result.value;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: process.env.NODE_ENV === 'test' ? false : 3,
  });
}

export function useConsultationByAppointment(appointmentId: string | number) {
  const appointmentIdStr = appointmentId.toString();

  return useQuery({
    queryKey: consultationKeys.byAppointment(appointmentIdStr),
    queryFn: async () => {
      const result = await getConsultationByAppointment(appointmentIdStr);

      if (!result.success) {
        if (
          result.error?.includes('not found') ||
          result.error?.includes('404')
        ) {
          return null;
        }
        throw new Error(result.error || 'Failed to load consultation');
      }

      return result.value || null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: process.env.NODE_ENV === 'test' ? false : (failureCount, error) => {
      if (
        error?.message.includes('404') ||
        error?.message.includes('not found')
      ) {
        return false;
      }
      return failureCount < 3;
    },
    enabled: !!appointmentId,
  });
}

export function useLatestConsultationByPatient(patientId: string | number) {
  const patientIdStr = patientId.toString();

  return useQuery({
    queryKey: consultationKeys.latestByPatient(patientIdStr),
    queryFn: async () => {
      const result = await getLatestConsultationByPatient(patientIdStr);

      if (!result.success) {
        if (
          result.error?.includes('not found') ||
          result.error?.includes('404')
        ) {
          return null;
        }
        throw new Error(result.error || 'Error loading latest consultation');
      }

      return result.value || null;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: process.env.NODE_ENV === 'test' ? false : (failureCount, error) => {
      if (
        error?.message.includes('404') ||
        error?.message.includes('not found')
      ) {
        return false;
      }
      return failureCount < 3;
    },
    enabled: !!patientId,
  });
}

export function useFetchConsultationByAppointment() {
  const queryClient = useQueryClient();

  return useCallback(
    (appointmentId: string | number, options?: { staleTime?: number }) => {
      const idStr = appointmentId.toString();
      return queryClient.fetchQuery({
        queryKey: consultationKeys.byAppointment(idStr),
        queryFn: () => getConsultationByAppointment(idStr),
        staleTime: options?.staleTime,
      });
    },
    [queryClient],
  );
}

export function useCreateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConsultationRequest) => {
      try {
        const result = await createConsultation(data);

        if (!result.success || !result.value) {
          throw new Error(result.error || 'Failed to create consultation');
        }

        return result.value as UpdateConsultationResponseDto;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });

      if (variables.appointmentId) {
        queryClient.invalidateQueries({
          queryKey: consultationKeys.byAppointment(
            variables.appointmentId.toString(),
          ),
        });
      }
    },
    onError: (error) => {
      console.error('Error creating consultation:', error);
    },
  });
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string | number;
      data: UpdateConsultationRequest;
    }) => {
      const result = await updateConsultation(id.toString(), data);

      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to update consultation');
      }

      return result.value as UpdateConsultationResponseDto;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: consultationKeys.detail(id.toString()),
      });

      const appointmentId = data.consultation?.appointmentId;
      if (appointmentId != null) {
        queryClient.invalidateQueries({
          queryKey: consultationKeys.byAppointment(appointmentId.toString()),
        });
      }
    },
    onError: (error) => {
      console.error('Error updating consultation:', error);
    },
  });
}

export function useDeleteConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const result = await deleteConsultation(id.toString());

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete consultation');
      }

      return true;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: consultationKeys.detail(id.toString()),
      });
      queryClient.removeQueries({
        queryKey: consultationKeys.detail(id.toString()),
      });
    },
    onError: (error) => {
      console.error('Error deleting consultation:', error);
    },
  });
}

export function useScheduleReturnAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      consultationId,
      mode,
    }: {
      consultationId: number;
      mode: 'legacy' | 'auto-return';
    }) => {
      const result = await scheduleReturnAppointment(consultationId, mode);

      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to schedule follow-up');
      }

      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error) => {
      console.error('Error scheduling return appointment:', error);
    },
  });
}

export function useConsultationsCompat() {
  const {
    data: consultations = [],
    isLoading: loading,
    error: queryError,
  } = useConsultations();
  const createMutation = useCreateConsultation();
  const updateMutation = useUpdateConsultation();
  const deleteMutation = useDeleteConsultation();
  const queryClient = useQueryClient();

  const error = queryError ? (queryError as Error).message : null;

  const refreshConsultations = async () => {
    await queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
  };

  const getConsultationForAppointment = async (
    appointmentId: number,
  ): Promise<ConsultationResponseDto | null> => {
    const result = await queryClient.fetchQuery({
      queryKey: consultationKeys.byAppointment(appointmentId.toString()),
      queryFn: async () => {
        const apiResult = await getConsultationByAppointment(
          appointmentId.toString(),
        );
        return apiResult.success ? apiResult.value || null : null;
      },
    });
    return result;
  };

  const createConsultation = async (
    data: CreateConsultationRequest,
  ): Promise<ConsultationResponseDto | null> => {
    try {
      const response = await createMutation.mutateAsync(data);
      return response.consultation;
    } catch (err) {
      console.error('Error in createConsultation:', err);
      return null;
    }
  };

  const updateConsultation = async (
    id: number,
    data: UpdateConsultationRequest,
  ): Promise<ConsultationResponseDto | null> => {
    try {
      const response = await updateMutation.mutateAsync({ id, data });
      return response.consultation;
    } catch (err) {
      console.error('Error in updateConsultation:', err);
      return null;
    }
  };

  const deleteConsultation = async (id: number): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (err) {
      console.error('Error in deleteConsultation:', err);
      return false;
    }
  };

  return {
    consultations,
    loading,
    error,
    refreshConsultations,
    getConsultationForAppointment,
    createConsultation,
    updateConsultation,
    deleteConsultation,
  };
}
