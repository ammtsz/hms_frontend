export const attendanceKeys = {
  all: ['attendances'] as const,
  lists: () => [...attendanceKeys.all, 'list'] as const,
  list: (filters: string) => [...attendanceKeys.lists(), { filters }] as const,
  details: () => [...attendanceKeys.all, 'detail'] as const,
  detail: (id: number) => [...attendanceKeys.details(), id] as const,
  byDate: (date: string) => [...attendanceKeys.all, 'byDate', date] as const,
  nextDate: () => [...attendanceKeys.all, 'nextDate'] as const,
  nextAvailableDate: (ids: number[]) =>
    [...attendanceKeys.all, 'nextAvailableDate', [...ids].sort((a, b) => a - b)] as const,
  unresolvedPast: () => [...attendanceKeys.all, 'unresolvedPast'] as const,
  eligibleParentOptions: (patientId: string) =>
    [...attendanceKeys.all, 'eligibleParentOptions', patientId] as const,
} as const;
