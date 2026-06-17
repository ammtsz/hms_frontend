import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSessionsByTreatment,
  getSessionsByPatient,
  getSessionsByAttendance,
  completeSession,
} from '@/api/sessions';
import { updateTreatment } from '@/api/treatments';
import type { CompleteSessionRequest, SessionResponseDto, TreatmentResponseDto } from '@/api/types';
import { invalidateAttendanceTreatmentCaches } from '@/api/query/invalidation/invalidateAttendanceTreatmentCaches';

import { sessionsQueryKeys } from '@/api/query/keys/sessionsQueryKeys';

/** Session rows for one treatment plan (`GET /sessions/treatment/:treatmentId`). */
export const useSessionsByTreatment = (treatmentId: number) => {
  return useQuery({
    queryKey: sessionsQueryKeys.byTreatment(treatmentId.toString()),
    queryFn: async () => {
      const response = await getSessionsByTreatment(treatmentId.toString());

      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar sessões');
      }

      return response.value || [];
    },
    enabled: treatmentId > 0,
    staleTime: 5 * 60 * 1000,
    retry: process.env.NODE_ENV === 'test' ? false : 2,
  });
};

/** All session rows for a patient (`GET /sessions/patient/:patientId`). */
export const useSessionsByPatient = (patientId: string) => {
  return useQuery({
    queryKey: sessionsQueryKeys.byPatient(patientId),
    queryFn: async () => {
      const response = await getSessionsByPatient(patientId);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar sessões');
      }

      return response.value || [];
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    retry: process.env.NODE_ENV === 'test' ? false : 2,
  });
};

export interface AttendanceSessionsInfo {
  attendanceId: number;
  sessions: SessionResponseDto[];
}

/**
 * Session rows grouped by attendance (parallel `GET /sessions/attendance/:id`).
 */
export const useSessionsByAttendances = (attendanceIds: number[]) => {
  const results = useQueries({
    queries: attendanceIds.map((attendanceId) => ({
      queryKey: sessionsQueryKeys.byAttendance(attendanceId),
      queryFn: async () => {
        const response = await getSessionsByAttendance(attendanceId);
        if (!response.success) {
          throw new Error(response.error || 'Erro ao carregar sessões');
        }
        return { attendanceId, sessions: response.value || [] } as AttendanceSessionsInfo;
      },
      enabled: attendanceIds.length > 0,
      staleTime: 5 * 60 * 1000,
      retry: process.env.NODE_ENV === 'test' ? false : 2,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const error = results.find((r) => r.error)?.error ?? null;
  const dataMap = new Map<number, SessionResponseDto[]>();
  results.forEach((r) => {
    if (r.data) {
      dataMap.set(r.data.attendanceId, r.data.sessions);
    }
  });

  const refetch = async () => {
    await Promise.all(results.map((r) => r.refetch()));
  };

  return {
    dataByAttendance: dataMap,
    isLoading,
    isError,
    error,
    results,
    refetch,
  };
};

/** Complete one session row and bump completed count on the parent treatment. */
export const useCompleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionRowId,
      treatmentId,
      completionData,
      newCompletedCount,
    }: {
      sessionRowId: string;
      treatmentId: string;
      completionData: CompleteSessionRequest;
      newCompletedCount: number;
    }) => {
      const sessionResponse = await completeSession(sessionRowId, completionData);

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.error || 'Erro ao completar sessão');
      }

      const treatmentResponse = await updateTreatment(treatmentId, {
        completedSessions: newCompletedCount,
      });

      if (!treatmentResponse.success) {
        console.warn(`Failed to update treatment ${treatmentId}:`, treatmentResponse.error);
      }

      return {
        session: sessionResponse.value,
        treatment: treatmentResponse.value,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: sessionsQueryKeys.byTreatment(variables.treatmentId),
      });
      queryClient.invalidateQueries({ queryKey: sessionsQueryKeys.all });
      invalidateAttendanceTreatmentCaches(queryClient);
    },
    onError: (err) => {
      console.error('Error completing session:', err);
    },
  });
};

export const useBulkCompleteSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      completions: Array<{
        treatmentId: string;
        completionData: CompleteSessionRequest;
        newCompletedCount: number;
      }>,
    ) => {
      const results: Array<{
        sessionRowId: string;
        treatmentId: string;
        success: boolean;
        session?: SessionResponseDto;
        treatment?: TreatmentResponseDto;
        error?: string;
      }> = [];

      for (const completion of completions) {
        try {
          const sessionsResponse = await getSessionsByTreatment(completion.treatmentId);

          if (!sessionsResponse.success || !sessionsResponse.value) {
            throw new Error(
              `Failed to get sessions for treatment ${completion.treatmentId}: ${sessionsResponse.error}`,
            );
          }

          const nextSessionToComplete = sessionsResponse.value.find(
            (sessionRow) =>
              sessionRow.status === 'scheduled' &&
              sessionRow.sessionNumber === completion.newCompletedCount,
          );

          if (!nextSessionToComplete) {
            throw new Error(
              `No scheduled row for treatment ${completion.treatmentId} at session number ${completion.newCompletedCount}`,
            );
          }

          const sessionResponse = await completeSession(
            nextSessionToComplete.id.toString(),
            completion.completionData,
          );

          if (!sessionResponse.success) {
            throw new Error(`Session ${nextSessionToComplete.id}: ${sessionResponse.error}`);
          }

          const treatmentResponse = await updateTreatment(completion.treatmentId, {
            completedSessions: completion.newCompletedCount,
          });

          if (!treatmentResponse.success) {
            console.warn(`Failed to update treatment ${completion.treatmentId}:`, treatmentResponse.error);
          }

          results.push({
            sessionRowId: nextSessionToComplete.id.toString(),
            treatmentId: completion.treatmentId,
            success: true,
            session: sessionResponse.value,
            treatment: treatmentResponse.value,
          });
        } catch (caught) {
          results.push({
            sessionRowId: `treatment_${completion.treatmentId}`,
            treatmentId: completion.treatmentId,
            success: false,
            error: caught instanceof Error ? caught.message : String(caught),
          });
        }
      }

      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        throw new Error(`Falhou ao completar ${failures.length} sessão(ões)`);
      }

      return results;
    },
    onSuccess: (mutationResults) => {
      const treatmentIds = [...new Set(mutationResults.map((r) => r.treatmentId))];
      treatmentIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: sessionsQueryKeys.byTreatment(id),
        });
      });
      invalidateAttendanceTreatmentCaches(queryClient);
    },
    onError: (err) => {
      console.error('Error in bulk complete sessions:', err);
    },
  });
};
