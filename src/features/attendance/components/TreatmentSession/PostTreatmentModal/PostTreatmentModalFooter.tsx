import React from "react";
import { getPostTreatmentFooterStatus } from "./postTreatmentFooter.utils";
import { Button } from "@/components/ui";

interface PostTreatmentModalFooterProps {
  submitError: string | null;
  canSubmit: boolean;
  uncheckedWithMissingReason: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const PostTreatmentModalFooter: React.FC<
  PostTreatmentModalFooterProps
> = ({
  submitError,
  canSubmit,
  uncheckedWithMissingReason,
  isSubmitDisabled,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const status = getPostTreatmentFooterStatus(
    canSubmit,
    uncheckedWithMissingReason,
  );

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-300 shrink-0">
      {submitError && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {submitError}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">
          <span
            className={
              status.variant === "ready"
                ? "text-green-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {status.message}
          </span>
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            isLoading={isSubmitting}
            loadingText="Registering..."
          >
            Register Session
          </Button>
        </div>
      </div>
    </div>
  );
};
