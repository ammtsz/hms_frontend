import React, { useRef } from "react";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/ui";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onLeave: () => void;
  onStay: () => void;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onLeave,
  onStay,
}) => {
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onStay}
      title="Unsaved Changes"
      maxWidth="md"
      showCloseButton={false}
      initialFocusRef={stayButtonRef}
    >
      <div className="p-6">
        {/* Message */}
        <div className="text-start mb-6">
          <p className="text-gray-800">
            If you leave now, all changes will be lost. Are you sure you want to
            leave?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            ref={stayButtonRef}
            type="button"
            onClick={onStay}
            className="flex-1 order-1 sm:order-2"
          >
            Continue Editing
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onLeave}
            className="flex-1 order-2 sm:order-1"
          >
            Leave Without Saving
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default UnsavedChangesModal;
