import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllHolidays,
  getUpcomingHolidays,
  getHolidayById,
  checkIfHoliday,
  checkHolidayConflicts,
  createHoliday,
  updateHoliday,
  updateHolidayGroup,
  deleteHoliday,
  createHolidayPeriod,
} from '@/api/holidays';
import {
  CreateHolidayRequest,
  UpdateHolidayRequest,
  UpdateHolidayGroupRequest,
  CreateHolidayPeriodRequest,
} from '@/types/holiday';

import { HOLIDAY_QUERY_KEYS } from '@/api/query/keys/holidayKeys';

export function useHolidays(year?: number) {
  return useQuery({
    queryKey: HOLIDAY_QUERY_KEYS.list(year),
    queryFn: async () => {
      const result = await getAllHolidays(year);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to fetch holidays');
      }
      return result.value;
    },
  });
}

export function useUpcomingHolidays(limit: number = 5) {
  return useQuery({
    queryKey: HOLIDAY_QUERY_KEYS.upcoming(limit),
    queryFn: async () => {
      const result = await getUpcomingHolidays(limit);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to fetch upcoming holidays');
      }
      return result.value;
    },
  });
}

export function useHoliday(id: number) {
  return useQuery({
    queryKey: HOLIDAY_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const result = await getHolidayById(id);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to fetch holiday');
      }
      return result.value;
    },
    enabled: !!id,
  });
}

export function useCheckIfHoliday(date: string) {
  return useQuery({
    queryKey: HOLIDAY_QUERY_KEYS.check(date),
    queryFn: async () => {
      const result = await checkIfHoliday(date);
      if (!result.success || result.value === undefined) {
        throw new Error(result.error || 'Failed to check if date is holiday');
      }
      return result.value;
    },
    enabled: !!date,
  });
}

export function useCheckHolidayConflicts(date: string) {
  return useQuery({
    queryKey: HOLIDAY_QUERY_KEYS.conflicts(date),
    queryFn: async () => {
      const result = await checkHolidayConflicts(date);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to check holiday conflicts');
      }
      return result.value;
    },
    enabled: !!date,
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHolidayRequest) => {
      const result = await createHoliday(data);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to create holiday');
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_QUERY_KEYS.all });
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateHolidayRequest }) => {
      const result = await updateHoliday(id, data);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to update holiday');
      }
      return result.value;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: HOLIDAY_QUERY_KEYS.detail(variables.id),
      });
    },
  });
}

export function useUpdateHolidayGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: UpdateHolidayGroupRequest }) => {
      const result = await updateHolidayGroup(groupId, data);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to update holiday group');
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_QUERY_KEYS.all });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteHoliday(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete holiday');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_QUERY_KEYS.all });
    },
  });
}

export function useCreateHolidayPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHolidayPeriodRequest) => {
      const result = await createHolidayPeriod(data);
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Failed to create holiday period');
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_QUERY_KEYS.all });
    },
  });
}
