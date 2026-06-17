"use client";

import React from "react";

interface TreatmentStatusBadgeProps {
  /** Treatment status (N, T, A, F) */
  status: string;
  /** Additional CSS classes */
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  N: "Paciente Novo",
  T: "Em Tratamento",
  A: "Alta do tratamento",
  F: "Faltas Consecutivas",
};

/**
 * TreatmentStatusBadge - Displays patient treatment status with color coding
 */
export const TreatmentStatusBadge: React.FC<TreatmentStatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const getStatusConfig = () => {
    const baseClasses =
      "inline-flex items-center px-3 rounded text-sm font-medium border rounded-md h-8";
    const label = STATUS_LABELS[status] ?? status;

    switch (status) {
      case "N":
        return {
          className: `${baseClasses} border-blue-500 text-blue-700 bg-blue-50`,
          label,
        };
      case "T":
        return {
          className: `${baseClasses} border-green-500 text-green-700 bg-green-50`,
          label,
        };
      case "A":
        return {
          className: `${baseClasses} border-purple-500 text-purple-700 bg-purple-50`,
          label,
        };
      case "F":
        return {
          className: `${baseClasses} border-orange-500 text-orange-700 bg-orange-50`,
          label,
        };
      default:
        return {
          className: `${baseClasses} border-gray-400 text-gray-600 bg-gray-50`,
          label,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`${config.className} ${className}`}>{config.label}</span>
  );
};
