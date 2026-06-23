import React from "react";

interface TreatmentBadgeProps {
  type: "physiotherapy" | "tens";
  variant?: "icon" | "badge";
}

/**
 * TreatmentBadge - Displays treatment type icon or badge
 */
export const TreatmentBadge: React.FC<TreatmentBadgeProps> = ({
  type,
  variant = "badge",
}) => {
  if (variant === "icon") {
    if (type === "physiotherapy") {
      return (
        <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
      );
    } else {
      return (
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
          <span className="text-2xl">🪄</span>
        </div>
      );
    }
  }

  if (type === "physiotherapy") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        ✨ Physiotherapy
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        🪄 TENS
      </span>
    );
  }
};
