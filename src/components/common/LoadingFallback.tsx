import React from "react";

interface LoadingFallbackProps {
  message?: string;
  size?: "small" | "medium" | "large";
  showSpinner?: boolean;
  className?: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = "Carregando...",
  size = "medium",
  showSpinner = true,
  className = "",
}) => {
  const sizeClasses = {
    small: "p-4 text-sm",
    medium: "p-8 text-base",
    large: "p-12 text-lg",
  };

  const spinnerSizes = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  };

  return (
    <div
      className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <div className="flex items-center space-x-3">
        {showSpinner && (
          <div
            className={`${spinnerSizes[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin`}
            role="status"
            aria-label="Loading"
          />
        )}
        <span className="text-gray-600 font-medium">{message}</span>
      </div>
    </div>
  );
};

export default LoadingFallback;
