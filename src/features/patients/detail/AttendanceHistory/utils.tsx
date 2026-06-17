import React from "react";
import { AlertTriangle, Ban } from "lucide-react";

export type AttendanceStatus = "completed" | "missed" | "cancelled";

export interface StatusConfig {
  borderColor: string;
  badgeClass: string;
  icon: React.ReactElement | null;
  label: string;
}

/**
 * Get styling configuration for attendance status
 */
export const getStatusConfig = (status?: string): StatusConfig => {
  switch (status) {
    case "missed":
      return {
        borderColor: "border border-gray-50",
        badgeClass: "bg-red-100 text-red-800 border border-red-300",
        icon: <AlertTriangle size={16} className="inline mr-1" />,
        label: "Falta",
      };
    case "cancelled":
      return {
        borderColor: "border border-gray-50",
        badgeClass: "bg-orange-100 text-orange-800 border border-orange-300",
        icon: <Ban size={16} className="inline mr-1" />,
        label: "Cancelado",
      };
    default: // completed
      return {
        borderColor: "border-gray-200",
        badgeClass: "bg-green-100 text-green-800 border border-green-300",
        icon: null,
        label: "Concluído",
      };
  }
};

/**
 * Get treatment type label from grouped attendance
 */
export const getTreatmentTypeLabel = (
  assessment: boolean,
  physiotherapy: boolean,
  tens: boolean,
): string => {
  if (assessment && physiotherapy && tens)
    return "Consulta de Avaliação, Fisioterapia e TENS";
  if (assessment && physiotherapy)
    return "Consulta de Avaliação e Fisioterapia";
  if (assessment && tens) return "Consulta de Avaliação e TENS";
  if (assessment) return "Consulta de Avaliação";
  if (physiotherapy && tens) return "Fisioterapia e TENS";
  if (physiotherapy) return "Fisioterapia";
  if (tens) return "TENS";
  return "Não especificado";
};
