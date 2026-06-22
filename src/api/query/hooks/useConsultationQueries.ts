import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConsultations,
  getConsultationByAttendance,
  getLatestConsultationByPatient,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  scheduleReturnAttendance,
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

export function useConsultationByAttendance(attendanceId: string | number) {
  const attendanceIdStr = attendanceId.toString();

  return useQuery({
    queryKey: consultationKeys.byAttendance(attendanceIdStr),
    queryFn: async () => {
      const result = await getConsultationByAttendance(attendanceIdStr);

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
    enabled: !!attendanceId,
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

export function useFetchConsultationByAttendance() {
  const queryClient = useQueryClient();

  return useCallback(
    (attendanceId: string | number, options?: { staleTime?: number }) => {
      const idStr = attendanceId.toString();
      return queryClient.fetchQuery({
        queryKey: consultationKeys.byAttendance(idStr),
        queryFn: () => getConsultationByAttendance(idStr),
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

      if (variables.attendanceId) {
        queryClient.invalidateQueries({
          queryKey: consultationKeys.byAttendance(
            variables.attendanceId.toString(),
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

      const attendanceId = data.consultation?.attendanceId;
      if (attendanceId != null) {
        queryClient.invalidateQueries({
          queryKey: consultationKeys.byAttendance(attendanceId.toString()),
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

export function useScheduleReturnAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      consultationId,
      mode,
    }: {
      consultationId: number;
      mode: 'legacy' | 'auto-return';
    }) => {
      const result = await scheduleReturnAttendance(consultationId, mode);

      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to schedule follow-up');
      }

      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
    },
    onError: (error) => {
      console.error('Error scheduling return attendance:', error);
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

  const getConsultationForAttendance = async (
    attendanceId: number,
  ): Promise<ConsultationResponseDto | null> => {
    const result = await queryClient.fetchQuery({
      queryKey: consultationKeys.byAttendance(attendanceId.toString()),
      queryFn: async () => {
        const apiResult = await getConsultationByAttendance(
          attendanceId.toString(),
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
    getConsultationForAttendance,
    createConsultation,
    updateConsultation,
    deleteConsultation,
  };
}
