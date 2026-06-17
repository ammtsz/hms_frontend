import React from "react";
import { XCircle, X } from "lucide-react";
import { IconButton } from "@/components/ui";

interface ErrorDisplayProps {
  error: string | null;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  className = "",
  dismissible = false,
  onDismiss,
}) => {
  if (!error) return null;

  return (
    <div className={`p-4 bg-red-50 border-l-4 border-red-400 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-700">{error}</p>
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <IconButton
                tone="danger"
                onClick={onDismiss}
                className="rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </IconButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
