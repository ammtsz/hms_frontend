export const sessionsQueryKeys = {
  all: ['sessions'] as const,
  byTreatment: (treatmentId: string) =>
    [...sessionsQueryKeys.all, 'treatment', treatmentId] as const,
  byPatient: (patientId: string) => [...sessionsQueryKeys.all, 'patient', patientId] as const,
  byAppointment: (appointmentId: number) =>
    [...sessionsQueryKeys.all, 'appointment', appointmentId] as const,
};
