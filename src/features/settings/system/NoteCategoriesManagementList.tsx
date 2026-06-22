"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Pencil, Save, X, Plus, Trash2 } from "lucide-react";
import BaseModal from "@/components/common/BaseModal";
import type { SystemOption } from "@/types/systemOptions";
import {
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableMobileLabel,
  TableRow,
  stackedTableClasses,
} from "@/components/ui";
import {
  SYSTEM_DEFAULT_NOTE_CATEGORY_DELETE_TOOLTIP,
  SYSTEM_STATUS_CHANGE_CATEGORY_TOOLTIP,
  getCategoryLabel,
  useNoteCategoriesManagement,
} from "@/features/settings/system/hooks/useNoteCategoriesManagement";

export default function NoteCategoriesManagementList() {
  const {
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
    isDeleteBlockedSystemCategory,
    startEdit,
    cancelEdit,
    saveEdit,
    toggleActive,
    handleDelete,
    handleCreate,
  } = useNoteCategoriesManagement();

  if (isLoading) {
    return <div className="text-center py-6 text-gray-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">Error loading note categories.</div>
    );
  }

  return (
    <div className="space-y-4">
      <TableContainer className="[&>div]:overflow-visible md:[&>div]:overflow-x-auto">
        <Table className={stackedTableClasses.table}>
          <TableHeader className={stackedTableClasses.header}>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="hidden w-32 md:table-cell">Usage</TableHead>
              <TableHead align="center" className="w-32">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={stackedTableClasses.body}>
            {(categories ?? []).map((option: SystemOption) => {
              const isEditing = editingId === option.id;
              const label = getCategoryLabel(option);
              const isDeleteBlocked = isDeleteBlockedSystemCategory(option);
              const deleteTooltip = isSystemStatusChangeCategory(option)
                ? SYSTEM_STATUS_CHANGE_CATEGORY_TOOLTIP
                : SYSTEM_DEFAULT_NOTE_CATEGORY_DELETE_TOOLTIP;

              return (
                <TableRow key={option.id} className={stackedTableClasses.row}>
                  <TableCell className={stackedTableClasses.cell}>
                    <TableMobileLabel>Code</TableMobileLabel>
                    {option.value}
                  </TableCell>
                  <TableCell className={stackedTableClasses.cell}>
                    <TableMobileLabel>Label</TableMobileLabel>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          className="min-h-[36px] py-1"
                          maxLength={50}
                        />
                      </div>
                    ) : (
                      <span
                        className={
                          !option.isActive ? "text-gray-400 line-through" : ""
                        }
                      >
                        {label}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={stackedTableClasses.cell}>
                    <TableMobileLabel>Status</TableMobileLabel>
                    {isEditing ? (
                      isSystemStatusChangeCategory(option) ? (
                        <Badge
                          variant={option.isActive ? "success" : "neutral"}
                          title={SYSTEM_STATUS_CHANGE_CATEGORY_TOOLTIP}
                        >
                          {option.isActive ? "● Active" : "○ Inactive"}
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => toggleActive(option)}
                          disabled={updateMutation.isPending}
                          className={`rounded-full ${
                            option.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                          }`}
                          title={option.isActive ? "Deactivate" : "Activate"}
                        >
                          {option.isActive ? "● Active" : "○ Inactive"}
                        </Button>
                      )
                    ) : (
                      <Badge
                        variant={option.isActive ? "success" : "neutral"}
                        title={
                          isSystemStatusChangeCategory(option)
                            ? SYSTEM_STATUS_CHANGE_CATEGORY_TOOLTIP
                            : undefined
                        }
                      >
                        {option.isActive ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className={`${stackedTableClasses.cell} hidden md:table-cell`}
                  >
                    <TableMobileLabel>Usage</TableMobileLabel>
                    {typeof option.usageCount === "number" &&
                    option.usageCount > 0
                      ? `${option.usageCount} note(s)`
                      : "-"}
                  </TableCell>

                  <TableCell
                    align="center"
                    className={`${stackedTableClasses.actionsCell} md:text-center`}
                  >
                    <TableMobileLabel>Action</TableMobileLabel>
                    {isEditing ? (
                      <div className="flex gap-2 justify-center">
                        <IconButton
                          onClick={() => saveEdit(option)}
                          disabled={updateMutation.isPending}
                          tone="success"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          onClick={cancelEdit}
                          disabled={updateMutation.isPending}
                          tone="neutral"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <IconButton
                          onClick={() => startEdit(option)}
                          disabled={
                            !isAdmin || isSystemStatusChangeCategory(option)
                          }
                          tone="primary"
                          title={
                            isSystemStatusChangeCategory(option)
                              ? SYSTEM_STATUS_CHANGE_CATEGORY_TOOLTIP
                              : isAdmin
                                ? "Edit label"
                                : "Admin only"
                          }
                        >
                          <Pencil className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            if (!isAdmin) return;
                            if (isDeleteBlocked) return;
                            setDeleteOption(option);
                            setShowDeleteConfirm(true);
                          }}
                          disabled={!isAdmin || isDeleteBlocked}
                          tone="danger"
                          title={
                            isDeleteBlocked
                              ? deleteTooltip
                              : isAdmin
                                ? "Delete"
                                : "Admin only"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </IconButton>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {isAdding && (
        <Card className="space-y-3 border-blue-300 bg-blue-50 p-4">
          <div className="text-sm font-semibold text-blue-900">
            New note category
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code
              </label>
              <Input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                maxLength={50}
                placeholder="ex: patient_contact"
                pattern="[a-z0-9_-]+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
              </label>
              <Input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                maxLength={50}
                placeholder="ex: General"
              />
            </div>
          </div>
          {createError && (
            <div className="text-sm text-red-600">{createError}</div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
              loadingText="Creating..."
              className="flex-1"
            >
              Create
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="border-blue-200 hover:bg-blue-100"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {!isAdding && isAdmin && (
        <Button
          variant="outline"
          onClick={() => setIsAdding(true)}
          className="w-full border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600"
        >
          <Plus className="w-5 h-5" />
          New note category
        </Button>
      )}

      {showDeleteConfirm &&
        deleteOption &&
        createPortal(
          <BaseModal
            isOpen
            onClose={closeDeleteConfirm}
            title="Confirm Delete"
            maxWidth="md"
          >
            <div className="p-4 sm:p-6">
              <p className="mb-4 text-sm text-gray-600">
                Are you sure you want to delete &ldquo;
                {deleteOption.label ?? deleteOption.value}&rdquo;?
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="secondary"
                  onClick={closeDeleteConfirm}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 sm:flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  isLoading={deleteMutation.isPending}
                  loadingText="Deleting..."
                  className="sm:flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </BaseModal>,
          document.body,
        )}
    </div>
  );
}
