"use client";

import React, { useMemo } from "react";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";
import type { SystemOption } from "@/types/systemOptions";

interface PriorityBadgeProps {
  /** Priority level (1-3) */
  priority: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PriorityBadge - Displays patient priority level with color coding
 *
 * Priority labels are resolved from system options (`hms_system_options.label`).
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className = "",
}) => {
  const { data: prioritiesData } = usePriorities(true);

  const priorityLabel = useMemo(() => {
    const map = new Map<string, string>();
    (prioritiesData ?? ([] as SystemOption[])).forEach((p) => {
      map.set(p.value, p.label || p.value);
    });

    // If system options haven't loaded yet, show the code itself.
    return map.get(priority) ?? priority;
  }, [prioritiesData, priority]);

  const displayLabel = `P${priority} • ${priorityLabel}`;

  const getPriorityConfig = () => {
    const baseClasses =
      "inline-flex items-center px-3 rounded text-sm font-medium border rounded-md h-8";

    switch (priority) {
      case "1":
        return {
          className: `${baseClasses} border-red-500 text-red-700 bg-red-50`,
          label: displayLabel,
        };
      case "2":
        return {
          className: `${baseClasses} border-yellow-500 text-yellow-700 bg-yellow-50`,
          label: displayLabel,
        };
      case "3":
        return {
          className: `${baseClasses} border-blue-500 text-blue-700 bg-blue-50`,
          label: displayLabel,
        };
      case "4":
        return {
          className: `${baseClasses} border-gray-500 text-gray-700 bg-gray-50`,
          label: displayLabel,
        };
      case "5":
        return {
          className: `${baseClasses} border-gray-400 text-gray-600 bg-gray-50`,
          label: displayLabel,
        };
      default:
        return {
          className: `${baseClasses} border-gray-400 text-gray-600 bg-gray-50`,
          label: displayLabel,
        };
    }
  };

  const config = getPriorityConfig();

  return (
    <span className={`${config.className} ${className}`}>{config.label}</span>
  );
};
