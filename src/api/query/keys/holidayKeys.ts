export const HOLIDAY_QUERY_KEYS = {
  all: ['holidays'] as const,
  lists: () => [...HOLIDAY_QUERY_KEYS.all, 'list'] as const,
  list: (year?: number) => [...HOLIDAY_QUERY_KEYS.lists(), { year }] as const,
  upcoming: (limit?: number) =>
    [...HOLIDAY_QUERY_KEYS.all, 'upcoming', { limit }] as const,
  details: () => [...HOLIDAY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...HOLIDAY_QUERY_KEYS.details(), id] as const,
  check: (date: string) => [...HOLIDAY_QUERY_KEYS.all, 'check', date] as const,
  conflicts: (date: string) =>
    [...HOLIDAY_QUERY_KEYS.all, 'conflicts', date] as const,
};
