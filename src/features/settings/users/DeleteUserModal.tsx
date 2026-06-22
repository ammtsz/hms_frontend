"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { User } from "@/types/auth";
import {
  useDeleteUser,
  useDeactivateUser,
} from "@/api/query/hooks/useUserQueries";
import BaseModal from "@/components/common/BaseModal";
import { Button, Checkbox } from "@/components/ui";

interface DeleteUserModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteUserModal({
  user,
  onClose,
  onSuccess,
}: DeleteUserModalProps) {
  const [mode, setMode] = useState<"choose" | "deactivate" | "delete">(
    "choose",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deactivateUserMutation = useDeactivateUser();
  const deleteUserMutation = useDeleteUser();
  const loading =
    deactivateUserMutation.isPending || deleteUserMutation.isPending;

  const handleDeactivate = async () => {
    setError(null);
    try {
      await deactivateUserMutation.mutateAsync(user.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deactivating user");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setError(null);
    try {
      await deleteUserMutation.mutateAsync(user.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting user");
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={
        mode === "choose"
          ? "Delete User"
          : mode === "deactivate"
            ? "Deactivate User"
            : "Permanently Delete User"
      }
      maxWidth="md"
      preventOverflow
    >
      <div className="overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {mode === "choose" && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Choose how you want to remove the user:{" "}
              <span className="font-semibold">{user.name}</span>
            </p>

            <Button
              variant="outline"
              onClick={() => setMode("deactivate")}
              className="h-auto w-full justify-start border-2 p-4 text-left font-normal hover:border-blue-500 hover:bg-blue-50"
            >
              <div className="font-semibold text-gray-900 mb-1">
                Deactivate User (Recommended)
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• The user will not be able to log in</li>
                <li>• The data will be preserved</li>
                <li>• Can be reactivated later</li>
              </ul>
            </Button>

            <Button
              variant="outline"
              onClick={() => setMode("delete")}
              className="h-auto w-full justify-start border-2 border-red-300 p-4 text-left font-normal hover:border-red-500 hover:bg-red-50"
            >
              <div className="font-semibold text-red-900 mb-1">
                Permanently Delete User
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• This action cannot be undone</li>
                <li>• The user will be removed from the system</li>
                <li>• Their tokens will be revoked</li>
              </ul>
            </Button>
          </div>
        )}

        {mode === "deactivate" && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to deactivate the user{" "}
              <span className="font-semibold">{user.name}</span>?
            </p>
            <ul className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg space-y-2">
              <li>• The user will not be able to log in</li>
              <li>• The data will be preserved</li>
              <li>• Can be reactivated later</li>
            </ul>
          </div>
        )}

        {mode === "delete" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-semibold mb-2">
                  ATTENTION: This action cannot be undone!
                </p>
                <ul className="space-y-1">
                  <li>
                    • The user will be permanently removed from the system
                  </li>
                  <li>• All access tokens will be revoked</li>
                  <li>• This operation is irreversible</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="confirmDelete"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="mt-1 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="confirmDelete" className="text-sm text-gray-700">
                I confirm that I want to permanently delete the user{" "}
                <span className="font-semibold">{user.name}</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t bg-gray-50 p-6">
        {mode === "choose" ? (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => setMode("choose")}
              disabled={loading}
            >
              Back
            </Button>
            {mode === "deactivate" && (
              <Button
                onClick={handleDeactivate}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={loading}
                isLoading={loading}
                loadingText="Deactivating..."
              >
                Deactivate User
              </Button>
            )}
            {mode === "delete" && (
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={loading || !confirmDelete}
                isLoading={loading}
                loadingText="Deleting..."
              >
                Delete User Permanently
              </Button>
            )}
          </>
        )}
      </div>
    </BaseModal>
  );
}
