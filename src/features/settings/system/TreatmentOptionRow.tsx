"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, Check, X } from "lucide-react";
import BaseModal from "@/components/common/BaseModal";
import {
  Badge,
  Button,
  IconButton,
  Input,
  TableCell,
  TableMobileLabel,
  TableRow,
  stackedTableClasses,
} from "@/components/ui";
import {
  useUpdateBodyLocation,
  useDeleteBodyLocation,
  useUpdateColor,
  useDeleteColor,
} from "@/api/query/hooks/useSystemOptionsQueries";
import { SystemOptionType, SystemOption } from "@/types/systemOptions";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

interface TreatmentOptionRowProps {
  option: SystemOption;
  type: SystemOptionType;
}

export default function TreatmentOptionRow({
  option,
  type,
}: TreatmentOptionRowProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(option.value);
  const [editIsActive, setEditIsActive] = useState(option.isActive);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isBodyLocation = type === SystemOptionType.BODY_LOCATION;

  // Call all hooks unconditionally
  const updateBodyLocationMutation = useUpdateBodyLocation();
  const deleteBodyLocationMutation = useDeleteBodyLocation();
  const updateColorMutation = useUpdateColor();
  const deleteColorMutation = useDeleteColor();

  // Select the correct hooks based on type
  const updateMutation = isBodyLocation
    ? updateBodyLocationMutation
    : updateColorMutation;
  const deleteMutation = isBodyLocation
    ? deleteBodyLocationMutation
    : deleteColorMutation;

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(option.value);
    setEditIsActive(option.isActive);
    setError("");
  };

  const handleSave = async () => {
    if (!editValue.trim()) {
      setError("Name is required");
      return;
    }

    if (editValue.length > 50) {
      setError("Name must be at most 50 characters");
      return;
    }

    try {
      const updates: { value?: string; isActive?: boolean } = {};

      if (editValue.trim() !== option.value) {
        updates.value = editValue.trim();
      }

      if (editIsActive !== option.isActive) {
        updates.isActive = editIsActive;
      }

      // Only send update if something changed
      if (Object.keys(updates).length > 0) {
        await updateMutation.mutateAsync({
          id: option.id,
          updates,
        });
      }

      setIsEditing(false);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(option.value);
    setEditIsActive(option.isActive);
    setError("");
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(option.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError((err as Error).message);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <TableRow className={stackedTableClasses.row}>
        {/* Name */}
        <TableCell className={stackedTableClasses.cell}>
          <TableMobileLabel>Name</TableMobileLabel>
          {isEditing ? (
            <div>
              <Input
                type="text"
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  setError("");
                }}
                className="min-h-[36px] py-1"
                maxLength={50}
                autoFocus
              />
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
          ) : (
            <span
              className={!option.isActive ? "text-gray-400 line-through" : ""}
            >
              {option.value}
            </span>
          )}
        </TableCell>

        {/* Usage Count */}
        <TableCell
          className={`${stackedTableClasses.cell} hidden text-gray-600 md:table-cell`}
        >
          <TableMobileLabel>Usage</TableMobileLabel>
          {option.usageCount ? `${option.usageCount} sessions` : "-"}
        </TableCell>

        {/* Active Status Toggle */}
        <TableCell className={stackedTableClasses.cell}>
          <TableMobileLabel>Status</TableMobileLabel>
          {isEditing ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setEditIsActive(!editIsActive)}
              disabled={updateMutation.isPending}
              className={`rounded-full ${
                editIsActive
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50 cursor-pointer`}
            >
              {editIsActive ? "● Active" : "○ Inactive"}
            </Button>
          ) : (
            <Badge variant={option.isActive ? "success" : "neutral"}>
              {option.isActive ? "● Active" : "○ Inactive"}
            </Badge>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell
          className={`${stackedTableClasses.actionsCell} md:text-center`}
        >
          <TableMobileLabel>Actions</TableMobileLabel>
          <div className="flex justify-end gap-2 md:justify-center">
            {isEditing ? (
              <>
                <IconButton
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  tone="success"
                  title="Save"
                >
                  <Check className="w-5 h-5" />
                </IconButton>
                <IconButton
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  tone="neutral"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton
                  onClick={handleEdit}
                  disabled={!isAdmin}
                  tone="primary"
                  title={isAdmin ? "Edit" : "Only administrators can edit"}
                >
                  <Pencil className="w-4 h-4" />
                </IconButton>
                <IconButton
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={!isAdmin}
                  tone="danger"
                  title={isAdmin ? "Delete" : "Only administrators can delete"}
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm &&
        createPortal(
          <BaseModal
            isOpen
            onClose={() => setShowDeleteConfirm(false)}
            title="Confirm Deletion"
            maxWidth="md"
          >
            <div className="p-4 sm:p-6">
              <p className="mb-4 text-sm text-gray-600">
                Are you sure you want to delete &ldquo;{option.value}&rdquo;?
              </p>
              {option.usageCount && option.usageCount > 0 ? (
                <p className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-600">
                  ℹ️ This option was used in {option.usageCount} completed
                  session(s). Historical data will remain unchanged, but this
                  option will no longer appear in selection lists. You may
                  deactivate instead of deleting if you prefer.
                </p>
              ) : null}
              {error ? (
                <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
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
    </>
  );
}
