import React, { useRef } from "react";
import { CheckCircle } from "lucide-react";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/ui";

interface SuccessModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  additionalInfo?: React.ReactNode;
  onConfirm: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  title = "Success!",
  message,
  confirmLabel = "OK",
  additionalInfo,
  onConfirm,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onConfirm}
      title={title}
      maxWidth="md"
      showCloseButton={false}
      initialFocusRef={confirmButtonRef}
    >
      <div className="p-6">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>

        {/* Message */}
        <div
          className={`text-gray-700 text-center ${additionalInfo ? "mb-4" : "mb-6"}`}
        >
          {message}
        </div>

        {/* Additional Information (optional custom content) */}
        {additionalInfo && <div className="mb-6">{additionalInfo}</div>}

        {/* Confirm Button */}
        <div className="flex justify-center">
          <Button
            ref={confirmButtonRef}
            className="min-w-[120px]"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default SuccessModal;
