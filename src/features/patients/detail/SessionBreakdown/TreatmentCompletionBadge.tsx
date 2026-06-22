import React from "react";
import { ATTENDANCE_HISTORY_STATUS_LABELS } from "@/utils/attendanceStatusLabels";

interface TreatmentCompletionBadgeProps {
  /** Completion percentage (0-100) */
  completionPercentage: number;
  showCompletionPercentage?: boolean;
  /** Treatment status */
  status:
    | "scheduled"
    | "active"
    | "in_progress"
    | "completed"
    | "suspended"
    | "cancelled";
  /** Show detailed milestone info */
  showMilestone?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export const TreatmentCompletionBadge: React.FC<
  TreatmentCompletionBadgeProps
> = ({
  completionPercentage,
  status,
  showMilestone = false,
  size = "md",
  showCompletionPercentage = false,
}) => {
  // Get status configuration
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          color:
            "bg-gray-100 text-gray-700 border-l-4 border-l-green-500 border-gray-200",
          icon: "✅",
          label: ATTENDANCE_HISTORY_STATUS_LABELS.completed,
        };
      case "in_progress":
        return {
          color:
            "bg-gray-100 text-gray-700 border-l-4 border-l-blue-500 border-gray-200",
          icon: "▶️",
          label: ATTENDANCE_HISTORY_STATUS_LABELS.inProgress,
        };
      case "suspended":
        return {
          color:
            "bg-gray-100 text-gray-700 border-l-4 border-l-orange-500 border-gray-200",
          icon: "⏸️",
          label: ATTENDANCE_HISTORY_STATUS_LABELS.suspended,
        };
      case "cancelled":
        return {
          color:
            "bg-gray-100 text-gray-700 border-l-4 border-l-red-500 border-gray-200",
          icon: "❌",
          label: ATTENDANCE_HISTORY_STATUS_LABELS.cancelled,
        };
      default: // scheduled
        return {
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: "📅",
          label: ATTENDANCE_HISTORY_STATUS_LABELS.scheduled,
        };
    }
  };

  // Get milestone based on completion percentage
  const getMilestone = () => {
    if (completionPercentage >= 100) {
      return { emoji: "🏆", text: "Treatment Completed!" };
    }
    if (completionPercentage >= 75) {
      return { emoji: "🎯", text: "Almost There!" };
    }
    if (completionPercentage >= 50) {
      return { emoji: "📈", text: "Halfway" };
    }
    if (completionPercentage >= 25) {
      return { emoji: "🔄", text: "Making Progress" };
    }
    if (completionPercentage > 0) {
      return { emoji: "🚀", text: "Started" };
    }
    return { emoji: "📋", text: "Planned" };
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: "px-2 py-1",
      text: "text-xs",
      gap: "gap-1",
    },
    md: {
      padding: "px-3 py-1.5",
      text: "text-sm",
      gap: "gap-1.5",
    },
    lg: {
      padding: "px-4 py-2",
      text: "text-base",
      gap: "gap-2",
    },
  };

  const statusConfig = getStatusConfig();
  const milestone = getMilestone();
  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-start gap-2">
      {/* Status Badge */}
      <div
        className={`
        inline-flex items-center ${config.gap} ${config.padding} 
        ${statusConfig.color} border rounded-full 
        font-medium ${config.text}
      `}
      >
        <span>{statusConfig.icon}</span>
        <span>{statusConfig.label}</span>
        {showCompletionPercentage && completionPercentage > 0 && (
          <span className="ml-1">({completionPercentage}%)</span>
        )}
      </div>

      {/* Milestone Badge */}
      {showMilestone && completionPercentage > 0 && (
        <div
          className={`
          inline-flex items-center ${config.gap} ${config.padding}
          bg-purple-100 text-purple-800 border border-purple-200 rounded-full
          font-medium ${config.text}
        `}
        >
          <span>{milestone.emoji}</span>
          <span>{milestone.text}</span>
        </div>
      )}
    </div>
  );
};
