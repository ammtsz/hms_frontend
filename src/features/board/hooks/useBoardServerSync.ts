import { useCallback, useEffect } from 'react';
import {
  useAppointmentsByDate,
  useRefreshAppointments,
} from '@/api/query/hooks/useAppointmentQueries';
import {
  useBoardDataLoading,
  useAppointmentError,
  useSetAppointmentLoading,
  useSetAppointmentDataLoading,
  useSetAppointmentError,
} from '@/stores';
import type { AppointmentByDate } from '@/types/types';

export interface UseAppointmentServerSyncReturn {
  appointmentsByDate: AppointmentByDate | null;
  dataLoading: boolean;
  error: string | null;
  setAppointmentsByDate: (data: AppointmentByDate | null) => void;
  loadAppointmentsByDate: (date: string) => Promise<AppointmentByDate | null>;
  refreshCurrentDate: () => Promise<void>;
}

export function useBoardServerSync(
  selectedDate: string,
  setSelectedDate: (date: string) => void,
): UseAppointmentServerSyncReturn {
  const dataLoading = useBoardDataLoading();
  const error = useAppointmentError();

  const setLoading = useSetAppointmentLoading();
  const setDataLoading = useSetAppointmentDataLoading();
  const setError = useSetAppointmentError();

  const {
    data: appointmentsByDate,
    isLoading: queryLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useAppointmentsByDate(selectedDate);

  const refreshAppointments = useRefreshAppointments();

  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading, setLoading]);

  useEffect(() => {
    const errorMessage = appointmentsError
      ? (appointmentsError as Error).message
      : null;
    setError(errorMessage);
  }, [appointmentsError, setError]);

  const refreshCurrentDate = useCallback(async (): Promise<void> => {
    refreshAppointments(selectedDate);
  }, [refreshAppointments, selectedDate]);

  const loadAppointmentsByDate = useCallback(
    async (date: string): Promise<AppointmentByDate | null> => {
      try {
        setDataLoading(true);
        setError(null);

        if (date !== selectedDate) {
          setSelectedDate(date);
        } else {
          await refetchAppointments();
        }

        return appointmentsByDate || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load appointments';
        setError(errorMessage);
        console.error('Error loading appointments by date:', err);
        return null;
      } finally {
        setDataLoading(false);
      }
    },
    [
      selectedDate,
      setSelectedDate,
      setDataLoading,
      setError,
      refetchAppointments,
      appointmentsByDate,
    ],
  );

  const setAppointmentsByDate = useCallback(
    (_data: AppointmentByDate | null) => {
      refreshCurrentDate();
    },
    [refreshCurrentDate],
  );

  return {
    appointmentsByDate: appointmentsByDate || null,
    dataLoading,
    error,
    setAppointmentsByDate,
    loadAppointmentsByDate,
    refreshCurrentDate,
  };
}
