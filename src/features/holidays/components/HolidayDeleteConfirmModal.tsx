"use client";

import React from "react";
import BaseModal from "@/components/common/BaseModal";
import { Holiday } from "@/types/holiday";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import { Button } from "@/components/ui";

interface HolidayDeleteConfirmModalProps {
  holiday: Holiday | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const MODAL_FOOTER_CLASS =
  "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end";

const HolidayDeleteConfirmModal: React.FC<HolidayDeleteConfirmModalProps> = ({
  holiday,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  const { formatDate } = useDateHelpers();

  return (
    <BaseModal
      isOpen={Boolean(holiday)}
      onClose={onCancel}
      title="Confirm Deletion"
      maxWidth="md"
      showCloseButton={!isDeleting}
    >
      <div className="p-6">
        {holiday ? (
          <p className="mb-6 text-gray-600">
            Are you sure you want to delete the holiday{" "}
            <strong>{holiday.name}</strong> ({formatDate(holiday.holidayDate)})?
          </p>
        ) : null}
        <div className={MODAL_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting || !holiday}
            isLoading={isDeleting}
            loadingText="Deleting..."
          >
            Delete
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default HolidayDeleteConfirmModal;
