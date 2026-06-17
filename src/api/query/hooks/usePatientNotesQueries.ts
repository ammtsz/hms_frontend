import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPatientNotes,
  createPatientNote,
  updatePatientNote,
  deletePatientNote,
} from '@/api/patients';
import type {
  PatientNoteResponseDto,
  CreatePatientNoteRequest,
  UpdatePatientNoteRequest,
} from '@/api/types';

import { patientNotesKeys } from '@/api/query/keys/patientNotesKeys';

/**
 * Hook to fetch patient notes
 * Provides automatic caching, background refetching, and error handling
 */
export function usePatientNotes(patientId: string) {
  return useQuery({
    queryKey: patientNotesKeys.list(patientId),
    queryFn: async (): Promise<PatientNoteResponseDto[]> => {
      const result = await getPatientNotes(patientId);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar notas');
      }

      return result.value || [];
    },
    enabled: !!patientId,
    // Notes don't change very frequently, cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 15 minutes after last use
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Mutation hook for creating new patient notes
 * Automatically invalidates the notes list after successful creation
 */
export function useCreatePatientNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      noteData,
    }: {
      patientId: string;
      noteData: CreatePatientNoteRequest;
    }): Promise<PatientNoteResponseDto> => {
      const result = await createPatientNote(patientId, noteData);
      
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Erro ao criar nota');
      }

      return result.value;
    },
    onSuccess: (newNote, { patientId }) => {
      // Invalidate and refetch the notes list
      queryClient.invalidateQueries({ 
        queryKey: patientNotesKeys.list(patientId) 
      });
      
      // Optionally, we could also optimistically update the cache
      queryClient.setQueryData<PatientNoteResponseDto[]>(
        patientNotesKeys.list(patientId),
        (oldNotes = []) => [newNote, ...oldNotes]
      );
    },
    onError: () => {
      // Error handling can be implemented here if needed
      // For example: toast notifications, analytics, etc.
    },
  });
}

/**
 * Mutation hook for updating existing patient notes
 * Automatically updates the cache after successful update
 */
export function useUpdatePatientNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      noteId,
      noteData,
    }: {
      patientId: string;
      noteId: string;
      noteData: UpdatePatientNoteRequest;
    }): Promise<PatientNoteResponseDto> => {
      const result = await updatePatientNote(patientId, noteId, noteData);
      
      if (!result.success || !result.value) {
        throw new Error(result.error || 'Erro ao atualizar nota');
      }

      return result.value;
    },
    onSuccess: (updatedNote, { patientId }) => {
      // Update the specific note in the cache
      queryClient.setQueryData<PatientNoteResponseDto[]>(
        patientNotesKeys.list(patientId),
        (oldNotes = []) => 
          oldNotes.map((note) => 
            note.id === updatedNote.id ? updatedNote : note
          )
      );
    },
    onError: () => {
      // Error handling can be implemented here if needed
      // For example: toast notifications, analytics, etc.
    },
  });
}

/**
 * Mutation hook for deleting patient notes
 * Automatically removes the note from cache after successful deletion
 */
export function useDeletePatientNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      noteId,
    }: {
      patientId: string;
      noteId: string;
    }): Promise<void> => {
      const result = await deletePatientNote(patientId, noteId);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar nota');
      }
    },
    onSuccess: (_, { patientId, noteId }) => {
      // Remove the note from the cache
      queryClient.setQueryData<PatientNoteResponseDto[]>(
        patientNotesKeys.list(patientId),
        (oldNotes = []) => 
          oldNotes.filter((note) => note.id !== parseInt(noteId))
      );
    },
    onError: () => {
      // Error handling can be implemented here if needed
      // For example: toast notifications, analytics, etc.
    },
  });
}

/**
 * Utility function to prefetch patient notes
 * Useful for preloading notes when hovering or anticipating navigation
 */
export function usePrefetchPatientNotes() {
  const queryClient = useQueryClient();

  return (patientId: string) => {
    queryClient.prefetchQuery({
      queryKey: patientNotesKeys.list(patientId),
      queryFn: async () => {
        const result = await getPatientNotes(patientId);
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao carregar notas');
        }

        return result.value || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}