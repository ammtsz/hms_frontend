import React, { useRef, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { Button, Field, Input } from "@/components/ui";

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientName: string;
  isDeleting: boolean;
}

const DeletePatientModal: React.FC<DeletePatientModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  isDeleting,
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const confirmationInputRef = useRef<HTMLInputElement>(null);
  const expectedText = "DELETE";
  const isConfirmed = confirmationText.toUpperCase() === expectedText;

  const handleClose = () => {
    setConfirmationText("");
    onClose();
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Patient"
      maxWidth="md"
      initialFocusRef={confirmationInputRef}
    >
      <div className="p-6">
        {/* Warning Message */}
        <div className="text-center mb-6">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            This action cannot be undone!
          </p>
          <p className="text-sm text-gray-600">
            You are about to permanently delete the patient:
          </p>
          <p className="text-base font-bold text-gray-900 mt-2">
            {patientName}
          </p>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm text-yellow-800 font-semibold mb-2">
            ⚠️ Important:
          </p>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>
              All patient data will be deleted, including appointment history and
              treatment records if present
            </li>
            <li>This action cannot be undone</li>
          </ul>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <Field
            label={
              <>
                Type{" "}
                <span className="font-bold text-red-600">{expectedText}</span>{" "}
                to confirm:
              </>
            }
          >
            <Input
              ref={confirmationInputRef}
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type DELETE"
              disabled={isDeleting}
            />
          </Field>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            variant="danger"
            isLoading={isDeleting}
            loadingText="Deleting..."
            disabled={!isConfirmed}
            className="flex-1"
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeletePatientModal;
