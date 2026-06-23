import React from "react";
import { Button } from "@/components/ui";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading appointments...",
}) => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-[color:var(--text-muted)]">{message}</div>
    </div>
  );
};

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  retryButtonText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  retryButtonText = "Try again",
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-lg text-red-600">Error loading appointments</div>
      <div className="text-sm text-[color:var(--text-muted)]">{error}</div>
      <Button type="button" onClick={onRetry}>
        {retryButtonText}
      </Button>
    </div>
  );
};
