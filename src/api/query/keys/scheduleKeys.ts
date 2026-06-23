import type { AppointmentStatus } from '@/api/types';

/**
 * React Query keys for the schedule (calendar) feature.
 * Note: `all: ['schedule']` replaces the former `['agenda']` key — existing
 * client-side cache entries are invalidated on first deploy after this rename.
 */
export type ScheduleApiFilters = {
  statuses?: AppointmentStatus[];
  fromDate?: string;
  toDate?: string;
  type?: string;
  limit?: number;
};

export const scheduleKeys = {
  all: ['schedule'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (filters?: ScheduleApiFilters) =>
    [
      ...scheduleKeys.lists(),
      filters?.fromDate ?? '',
      filters?.toDate ?? '',
      filters?.statuses?.slice().sort().join('|') ?? 'all',
      filters?.type ?? '',
      filters?.limit ?? '',
    ] as const,
} as const;
