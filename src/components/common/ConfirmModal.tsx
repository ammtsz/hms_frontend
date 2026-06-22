import React from "react";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/ui";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmDisabled = false,
  onConfirm,
  onCancel,
}) => {
  const handleClose = () => {
    onCancel?.();
  };

  return (
    <BaseModal
      isOpen={open}
      onClose={handleClose}
      title={title}
      maxWidth="md"
      showCloseButton={false}
      closeOnOverlayClick={false}
    >
      <div className="p-6">
        <div className="mb-4 text-[color:var(--primary-dark)]">{message}</div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {cancelLabel ? (
            <Button variant="secondary" onClick={handleClose} type="button">
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            variant={confirmLabel === "Remove" ? "danger" : "primary"}
            onClick={onConfirm}
            type="button"
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmModal;
