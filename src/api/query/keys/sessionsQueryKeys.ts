export const sessionsQueryKeys = {
  all: ['sessions'] as const,
  byTreatment: (treatmentId: string) =>
    [...sessionsQueryKeys.all, 'treatment', treatmentId] as const,
  byPatient: (patientId: string) => [...sessionsQueryKeys.all, 'patient', patientId] as const,
  byAttendance: (attendanceId: number) =>
    [...sessionsQueryKeys.all, 'attendance', attendanceId] as const,
};
