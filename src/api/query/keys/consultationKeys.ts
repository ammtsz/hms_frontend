export const consultationKeys = {
  all: ['consultations'] as const,
  lists: () => [...consultationKeys.all, 'list'] as const,
  details: () => [...consultationKeys.all, 'detail'] as const,
  detail: (id: string) => [...consultationKeys.details(), id] as const,
  byAttendance: (attendanceId: string) =>
    [...consultationKeys.all, 'attendance', attendanceId] as const,
  latestByPatient: (patientId: string) =>
    [...consultationKeys.all, 'patient', patientId, 'latest'] as const,
};
