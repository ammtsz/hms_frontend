import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNoteCategory,
  deleteNoteCategory,
  getNoteCategories,
  updateNoteCategory,
} from "@/api/settings/note-categories";
import type { SystemOption } from "@/types/systemOptions";

import { noteCategoryKeys } from "@/api/query/keys/noteCategoryKeys";

export function useNoteCategories(includeInactive = false) {
  return useQuery({
    queryKey: [...noteCategoryKeys.all, includeInactive],
    queryFn: async () => {
      const result = await getNoteCategories(includeInactive);
      if (!result.success || !result.value) {
        throw new Error(
          result.error || "Falha ao carregar categorias de notas",
        );
      }
      return result.value;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateNoteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { value: string; label: string; sortOrder?: number }) => {
      const result = await createNoteCategory(params);
      if (!result.success || !result.value) {
        throw new Error(result.error || "Falha ao criar categoria de notas");
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteCategoryKeys.all });
    },
  });
}

export function useUpdateNoteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<Pick<SystemOption, "value" | "label" | "isActive" | "sortOrder">>;
    }) => {
      const result = await updateNoteCategory(id, updates);
      if (!result.success || !result.value) {
        throw new Error(result.error || "Falha ao atualizar categoria de notas");
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteCategoryKeys.all });
    },
  });
}

export function useDeleteNoteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteNoteCategory(id);
      if (!result.success) {
        throw new Error(result.error || "Falha ao excluir categoria de notas");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteCategoryKeys.all });
    },
  });
}

