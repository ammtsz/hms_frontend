import type { AttendanceStatus } from '@/api/types';

export type AgendaApiFilters = {
  statuses?: AttendanceStatus[];
  fromDate?: string;
  toDate?: string;
  type?: string;
  limit?: number;
};

export const agendaKeys = {
  all: ['agenda'] as const,
  lists: () => [...agendaKeys.all, 'list'] as const,
  list: (filters?: AgendaApiFilters) =>
    [
      ...agendaKeys.lists(),
      filters?.fromDate ?? '',
      filters?.toDate ?? '',
      filters?.statuses?.slice().sort().join('|') ?? 'all',
      filters?.type ?? '',
      filters?.limit ?? '',
    ] as const,
} as const;
