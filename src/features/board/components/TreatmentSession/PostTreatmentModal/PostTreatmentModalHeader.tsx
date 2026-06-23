import React from "react";
import { IconButton } from "@/components/ui";

interface PostTreatmentModalHeaderProps {
  patientName: string;
  onClose: () => void;
  isSubmitting: boolean;
}

export const PostTreatmentModalHeader: React.FC<
  PostTreatmentModalHeaderProps
> = ({ patientName, onClose, isSubmitting }) => (
  <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between shrink-0">
    <div>
      <h2 className="text-lg font-bold text-gray-900">
        Register Treatment Session
      </h2>
      <p className="text-sm text-gray-600">Patient: {patientName}</p>
    </div>
    <IconButton
      onClick={onClose}
      className="text-2xl leading-none text-gray-400 hover:text-gray-600"
      disabled={isSubmitting}
      aria-label="Close"
    >
      ×
    </IconButton>
  </div>
);
