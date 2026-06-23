import { useCallback, useEffect } from 'react';
import {
  useAttendancesByDate,
  useRefreshAttendances,
} from '@/api/query/hooks/useAttendanceQueries';
import {
  useAttendanceDataLoading,
  useAttendanceError,
  useSetAttendanceLoading,
  useSetAttendanceDataLoading,
  useSetAttendanceError,
} from '@/stores';
import type { AttendanceByDate } from '@/types/types';

export interface UseAttendanceServerSyncReturn {
  attendancesByDate: AttendanceByDate | null;
  dataLoading: boolean;
  error: string | null;
  setAttendancesByDate: (data: AttendanceByDate | null) => void;
  loadAttendancesByDate: (date: string) => Promise<AttendanceByDate | null>;
  refreshCurrentDate: () => Promise<void>;
}

export function useAttendanceServerSync(
  selectedDate: string,
  setSelectedDate: (date: string) => void,
): UseAttendanceServerSyncReturn {
  const dataLoading = useAttendanceDataLoading();
  const error = useAttendanceError();

  const setLoading = useSetAttendanceLoading();
  const setDataLoading = useSetAttendanceDataLoading();
  const setError = useSetAttendanceError();

  const {
    data: attendancesByDate,
    isLoading: queryLoading,
    error: attendancesError,
    refetch: refetchAttendances,
  } = useAttendancesByDate(selectedDate);

  const refreshAttendances = useRefreshAttendances();

  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading, setLoading]);

  useEffect(() => {
    const errorMessage = attendancesError
      ? (attendancesError as Error).message
      : null;
    setError(errorMessage);
  }, [attendancesError, setError]);

  const refreshCurrentDate = useCallback(async (): Promise<void> => {
    refreshAttendances(selectedDate);
  }, [refreshAttendances, selectedDate]);

  const loadAttendancesByDate = useCallback(
    async (date: string): Promise<AttendanceByDate | null> => {
      try {
        setDataLoading(true);
        setError(null);

        if (date !== selectedDate) {
          setSelectedDate(date);
        } else {
          await refetchAttendances();
        }

        return attendancesByDate || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load attendances';
        setError(errorMessage);
        console.error('Error loading attendances by date:', err);
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
      refetchAttendances,
      attendancesByDate,
    ],
  );

  const setAttendancesByDate = useCallback(
    (_data: AttendanceByDate | null) => {
      refreshCurrentDate();
    },
    [refreshCurrentDate],
  );

  return {
    attendancesByDate: attendancesByDate || null,
    dataLoading,
    error,
    setAttendancesByDate,
    loadAttendancesByDate,
    refreshCurrentDate,
  };
}
