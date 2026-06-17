import React from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  message?: string;
  showSpinner?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  message = "Carregando...",
  showSpinner = true,
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  const containerClasses = {
    small: "p-4",
    medium: "p-8",
    large: "p-12",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center ${containerClasses[size]}`}
    >
      {showSpinner && (
        <div
          className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4`}
          role="status"
          aria-label="Carregando"
        />
      )}
      <p className="text-gray-600 text-center">{message}</p>
    </div>
  );
};
