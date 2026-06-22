import React from "react";
import BaseModal from "@/components/common/BaseModal";
import type { PendingStatusChange } from "@/features/patients/form/hooks/useEditPatientForm";
import { Button } from "@/components/ui";

interface ConfirmStatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pendingStatusChange: PendingStatusChange | null;
  isSaving: boolean;
}

const STATUS_LABELS: Record<"A" | "F", string> = {
  A: "Discharged",
  F: "Missed — consecutive",
};

const ConfirmStatusChangeModal: React.FC<ConfirmStatusChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pendingStatusChange,
  isSaving,
}) => {
  if (!pendingStatusChange) return null;

  const label = STATUS_LABELS[pendingStatusChange.newStatus];
  const { openCount } = pendingStatusChange;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Confirm change to ${label}`}
      maxWidth="md"
    >
      <div className="p-6">
        <p className="text-gray-700 mb-4">
          When changing to <strong>{label}</strong>, all open appointments
          (scheduled, checked in, or in progress) will be cancelled.
        </p>
        <p className="text-gray-700 mb-4">
          This patient has <strong>{openCount}</strong>{" "}
          {openCount === 1 ? "open appointment" : "open appointments"} that{" "}
          {openCount === 1 ? "will be cancelled" : "will be cancelled"}.
        </p>
        <p className="text-gray-700 mb-6">Do you want to continue?</p>
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isSaving}
            loadingText="Saving..."
            disabled={isSaving}
          >
            Yes, change status
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmStatusChangeModal;
