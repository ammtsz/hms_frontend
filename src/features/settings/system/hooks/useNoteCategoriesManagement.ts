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

export const SYSTEM_STATUS_CHANGE_CATEGORY_VALUE = "status_change";
export const SYSTEM_STATUS_CHANGE_CATEGORY_TOOLTIP =
  "The 'Status change' category cannot be edited or removed because it is used to generate automatic notes by the system.";
export const SYSTEM_DEFAULT_NOTE_CATEGORY_VALUES = ["general"] as const;
export const SYSTEM_DEFAULT_NOTE_CATEGORY_DELETE_TOOLTIP =
  "The 'General' category cannot be removed because it is the system's default category.";
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
      // translate to english
      showToast("Please enter a label for the category.", "error");
      return;
    }
    if (trimmed.length > 50) {
      showToast("Label must not exceed 50 characters.", "error");
      return;
    }

    await updateMutation.mutateAsync({
      id: option.id,
      updates: { label: trimmed },
    });
    cancelEdit();
    showToast("Category updated successfully.", "success");
  };

  const toggleActive = async (option: SystemOption) => {
    if (!isAdmin) return;
    if (isSystemStatusChangeCategory(option)) return;
    await updateMutation.mutateAsync({
      id: option.id,
      updates: { isActive: !option.isActive },
    });
    showToast(
      option.isActive ? "Category deactivated." : "Category activated.",
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
    showToast("Category deleted successfully.", "success");
  };

  const handleCreate = async () => {
    if (!isAdmin) return;

    const value = newValue.trim();
    const label = newLabel.trim();
    if (!value) {
      setCreateError("Please enter a code for the category.");
      return;
    }
    if (value.length > 50) {
      setCreateError("Code must not exceed 50 characters.");
      return;
    }
    if (!NOTE_CATEGORY_CODE_REGEX.test(value)) {
      setCreateError(
        "Invalid code. Use only lowercase letters (a-z), numbers (0-9), _ or -.",
      );
      return;
    }
    if (!label) {
      setCreateError("Please enter a label for the category.");
      return;
    }
    if (label.length > 50) {
      setCreateError("Label must not exceed 50 characters.");
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
      showToast("Category created successfully.", "success");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error creating category";
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
