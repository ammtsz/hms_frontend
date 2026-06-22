import React from "react";

interface SuccessHeaderProps {
  customMessage?: string;
}

/**
 * SuccessHeader - Displays success message and confirmation
 */
export const SuccessHeader: React.FC<SuccessHeaderProps> = ({
  customMessage,
}) => {
  return (
    <div className="flex items-center space-x-3 mb-6 h-full">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-green-600 text-lg">✅</span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Treatment registered successfully!
        </h3>
        {customMessage && (
          <p className="text-sm text-gray-600">{customMessage}</p>
        )}
      </div>
    </div>
  );
};
