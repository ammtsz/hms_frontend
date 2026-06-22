import { useState, useCallback } from "react";
import { useHolidays, useDeleteHoliday } from "@/api/query/hooks/useHolidayQueries";
import { Holiday } from "@/types/holiday";

/**
 * Custom hook for managing holiday management state and operations
 * Handles year selection, CRUD operations, and modal visibility
 */
export function useHolidayManagement() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

  const { data: holidays, isLoading, error } = useHolidays(selectedYear);
  const { mutate: deleteHoliday, isPending: isDeleting } =
    useDeleteHoliday();

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const handleDelete = useCallback((holiday: Holiday) => {
    setDeletingHoliday(holiday);
  }, []);

  const handleEdit = useCallback((holiday: Holiday) => {
    setEditingHoliday(holiday);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deletingHoliday) return;

    deleteHoliday(deletingHoliday.id, {
      onSuccess: () => {
        setDeletingHoliday(null);
      },
      onError: (error) => {
        console.error("Error deleting holiday:", error);
        alert("Error deleting holiday. Please try again.");
        setDeletingHoliday(null);
      },
    });
  }, [deletingHoliday, deleteHoliday]);

  return {
    // State
    selectedYear,
    showCreateModal,
    editingHoliday,
    deletingHoliday,
    holidays,
    isLoading,
    error,
    isDeleting,
    years,
    // Actions
    setSelectedYear,
    setShowCreateModal,
    setEditingHoliday,
    setDeletingHoliday,
    handleDelete,
    handleEdit,
    confirmDelete,
  };
}
