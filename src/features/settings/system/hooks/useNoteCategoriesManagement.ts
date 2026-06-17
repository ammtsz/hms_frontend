import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { UserRole } from "@/types/auth";
import type { SystemOption } from "@/types/systemOptions";
import {
  useCreateNoteCategory,
  useDeleteNoteCategory,
  useNoteCategories,
  useUpdateNoteCategory,
} from "@/api/query/hooks/useNoteCategoriesQueries";

export const SYSTEM_STATUS_CHANGE_CATEGORY_VALUE = "alteracao_de_status";
export const SYSTEM_STATUS_CHANGE_CATEGORY_TOOLTIP =
  "A categoria 'Mudança de status' não pode ser editada ou removida, pois é usada para gerar notas automáticas pelo sistema.";
export const SYSTEM_DEFAULT_NOTE_CATEGORY_VALUES = ["geral", "general"] as const;
export const SYSTEM_DEFAULT_NOTE_CATEGORY_DELETE_TOOLTIP =
  "A categoria 'Geral' não pode ser removida, pois é a categoria padrão do sistema.";
const NOTE_CATEGORY_CODE_REGEX = /^[a-z0-9_-]+$/;

export function getCategoryLabel(option: SystemOption): string {
  return option.label || option.value;
}

export function useNoteCategoriesManagement() {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const isAdmin = user?.role === UserRole.ADMIN;

  const { data: categories, isLoading, error } = useNoteCategories(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [createError, setCreateError] = useState("");

  const createMutation = useCreateNoteCategory();
  const updateMutation = useUpdateNoteCategory();
  const deleteMutation = useDeleteNoteCategory();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOption, setDeleteOption] = useState<SystemOption | null>(null);

  const isSystemStatusChangeCategory = (option: SystemOption) =>
    option.value === SYSTEM_STATUS_CHANGE_CATEGORY_VALUE;

  const isSystemDefaultNoteCategory = (option: SystemOption) =>
    SYSTEM_DEFAULT_NOTE_CATEGORY_VALUES.includes(
      option.value as (typeof SYSTEM_DEFAULT_NOTE_CATEGORY_VALUES)[number],
    );

  const isDeleteBlockedSystemCategory = (option: SystemOption) =>
    isSystemStatusChangeCategory(option) || isSystemDefaultNoteCategory(option);

  const startEdit = (option: SystemOption) => {
    if (!isAdmin) return;
    if (isSystemStatusChangeCategory(option)) return;
    setEditingId(option.id);
    setEditingLabel(getCategoryLabel(option));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingLabel("");
  };

  const saveEdit = async (option: SystemOption) => {
    if (!isAdmin) return;
    if (isSystemStatusChangeCategory(option)) return;
    const trimmed = editingLabel.trim();
    if (!trimmed) {
      showToast("Informe um rótulo para a categoria.", "error");
      return;
    }
    if (trimmed.length > 50) {
      showToast("Rótulo deve ter no máximo 50 caracteres.", "error");
      return;
    }

    await updateMutation.mutateAsync({
      id: option.id,
      updates: { label: trimmed },
    });
    cancelEdit();
    showToast("Categoria atualizada com sucesso.", "success");
  };

  const toggleActive = async (option: SystemOption) => {
    if (!isAdmin) return;
    if (isSystemStatusChangeCategory(option)) return;
    await updateMutation.mutateAsync({
      id: option.id,
      updates: { isActive: !option.isActive },
    });
    showToast(
      option.isActive ? "Categoria desativada." : "Categoria ativada.",
      "success",
    );
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteOption(null);
  };

  const handleDelete = async () => {
    if (!deleteOption) return;
    if (!isAdmin) return;
    if (isDeleteBlockedSystemCategory(deleteOption)) return;

    await deleteMutation.mutateAsync(deleteOption.id);
    closeDeleteConfirm();
    showToast("Categoria excluída com sucesso.", "success");
  };

  const handleCreate = async () => {
    if (!isAdmin) return;

    const value = newValue.trim();
    const label = newLabel.trim();
    if (!value) {
      setCreateError("Informe um código para a categoria.");
      return;
    }
    if (value.length > 50) {
      setCreateError("Código deve ter no máximo 50 caracteres.");
      return;
    }
    if (!NOTE_CATEGORY_CODE_REGEX.test(value)) {
      setCreateError(
        "Código inválido. Use apenas letras minúsculas (a-z), números (0-9), _ ou -.",
      );
      return;
    }
    if (!label) {
      setCreateError("Informe um rótulo para a categoria.");
      return;
    }
    if (label.length > 50) {
      setCreateError("Rótulo deve ter no máximo 50 caracteres.");
      return;
    }

    setCreateError("");
    try {
      await createMutation.mutateAsync({
        value,
        label,
        sortOrder: (categories ?? []).length + 1,
      });
      setIsAdding(false);
      setNewValue("");
      setNewLabel("");
      showToast("Categoria criada com sucesso.", "success");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao criar categoria";
      setCreateError(msg);
    }
  };

  return {
    isAdmin,
    categories,
    isLoading,
    error,
    editingId,
    editingLabel,
    setEditingLabel,
    isAdding,
    setIsAdding,
    newValue,
    setNewValue,
    newLabel,
    setNewLabel,
    createError,
    createMutation,
    updateMutation,
    deleteMutation,
    showDeleteConfirm,
    deleteOption,
    setDeleteOption,
    setShowDeleteConfirm,
    closeDeleteConfirm,
    isSystemStatusChangeCategory,
    isSystemDefaultNoteCategory,
    isDeleteBlockedSystemCategory,
    startEdit,
    cancelEdit,
    saveEdit,
    toggleActive,
    handleDelete,
    handleCreate,
  };
}
