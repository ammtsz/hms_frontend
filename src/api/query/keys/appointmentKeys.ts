export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters: string) => [...appointmentKeys.lists(), { filters }] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...appointmentKeys.details(), id] as const,
  byDate: (date: string) => [...appointmentKeys.all, 'byDate', date] as const,
  nextDate: () => [...appointmentKeys.all, 'nextDate'] as const,
  nextAvailableDate: (ids: number[]) =>
    [...appointmentKeys.all, 'nextAvailableDate', [...ids].sort((a, b) => a - b)] as const,
  unresolvedPast: () => [...appointmentKeys.all, 'unresolvedPast'] as const,
  eligibleParentOptions: (patientId: string) =>
    [...appointmentKeys.all, 'eligibleParentOptions', patientId] as const,
} as const;
