export const treatmentsQueryKeys = {
  all: ['treatments'] as const,
  byPatient: (patientId: string) => [...treatmentsQueryKeys.all, 'patient', patientId] as const,
};
