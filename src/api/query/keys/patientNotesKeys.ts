export const patientNotesKeys = {
  all: ['patientNotes'] as const,
  lists: () => [...patientNotesKeys.all, 'list'] as const,
  list: (patientId: string) => [...patientNotesKeys.lists(), patientId] as const,
  details: () => [...patientNotesKeys.all, 'detail'] as const,
  detail: (patientId: string, noteId: number) =>
    [...patientNotesKeys.details(), patientId, noteId] as const,
};
