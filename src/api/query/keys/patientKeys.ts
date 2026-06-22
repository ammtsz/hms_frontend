export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: string) => [...patientKeys.lists(), { filters }] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  attendances: (patientId: string) => ['attendances', 'patient', patientId] as const,
  mainConcern: (patientId: number) =>
    [...patientKeys.all, 'mainConcern', patientId] as const,
};
