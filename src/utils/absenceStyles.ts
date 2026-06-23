/**
 * Utility functions for absence/cancellation styling
 * Provides consistent styling across appointment components
 */

export type AbsenceStatus = "missed" | "cancelled" | "none";

interface AbsenceStyles {
  containerClass: string;
  textClass: string;
  dateClass: string;
  treatmentClass: string;
  reasonBoxClass: string;
  reasonBorderClass: string;
  iconColor: string;
  labelColor: string;
}

/**
 * Get styling classes based on absence status
 */
export function getAbsenceStyles(status: AbsenceStatus): AbsenceStyles {
  switch (status) {
    case "missed":
      return {
        containerClass: "bg-red-50 border-red-300",
        textClass: "text-gray-500 line-through",
        dateClass: "text-gray-500 line-through",
        treatmentClass: "text-gray-500 line-through",
        reasonBoxClass: "bg-red-100",
        reasonBorderClass: "border-red-500",
        iconColor: "text-red-600",
        labelColor: "text-red-600",
      };
    case "cancelled":
      return {
        containerClass: "bg-orange-50 border-orange-300",
        textClass: "text-gray-500 line-through",
        dateClass: "text-gray-500 line-through",
        treatmentClass: "text-gray-500 line-through",
        reasonBoxClass: "bg-orange-100",
        reasonBorderClass: "border-orange-500",
        iconColor: "text-orange-600",
        labelColor: "text-orange-600",
      };
    default:
      return {
        containerClass: "bg-gray-50 border-gray-200",
        textClass: "text-gray-900",
        dateClass: "text-gray-900",
        treatmentClass: "text-gray-600",
        reasonBoxClass: "bg-white",
        reasonBorderClass: "border-gray-500",
        iconColor: "",
        labelColor: "",
      };
  }
}

/**
 * Determine absence status from appointment status string
 */
export function getAbsenceStatus(status: string): AbsenceStatus {
  if (status === "missed") return "missed";
  if (status === "cancelled") return "cancelled";
  return "none";
}

/**
 * Check if status represents an absence
 */
export function isAbsence(status: string): boolean {
  return status === "missed" || status === "cancelled";
}
