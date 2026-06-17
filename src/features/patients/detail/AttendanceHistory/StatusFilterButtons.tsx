import React from "react";
import { cn } from "@/utils/cn";
import { StatusFilter } from "./hooks/useAttendanceHistory";

interface StatusFilterButtonsProps {
  statusFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}

interface FilterButton {
  value: StatusFilter;
  label: string;
  activeClass: string;
}

const FILTER_BUTTONS: FilterButton[] = [
  { value: "all", label: "Todos", activeClass: "bg-blue-600 text-white" },
  {
    value: "completed",
    label: "Concluídos",
    activeClass: "bg-green-600 text-white",
  },
  { value: "missed", label: "Faltas", activeClass: "bg-red-600 text-white" },
  {
    value: "cancelled",
    label: "Cancelados",
    activeClass: "bg-orange-600 text-white",
  },
];

const FILTER_CHIP_BASE =
  "inline-flex min-h-[28px] w-full items-center justify-center rounded-full px-4 py-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto";

const FILTER_CHIP_INACTIVE =
  "bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400";

/**
 * Filter buttons for attendance status
 * Allows filtering by all, completed, missed, or cancelled statuses
 */
export const StatusFilterButtons: React.FC<StatusFilterButtonsProps> = ({
  statusFilter,
  onFilterChange,
}) => {
  return (
    <div
      className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      role="group"
      aria-label="Filtrar histórico por status"
    >
      {FILTER_BUTTONS.map((button) => {
        const isActive = statusFilter === button.value;
        return (
          <button
            type="button"
            key={button.value}
            onClick={() => onFilterChange(button.value)}
            aria-pressed={isActive}
            className={cn(
              FILTER_CHIP_BASE,
              isActive ? button.activeClass : FILTER_CHIP_INACTIVE,
            )}
          >
            {button.label}
          </button>
        );
      })}
    </div>
  );
};
