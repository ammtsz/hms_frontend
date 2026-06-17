import React from "react";

/** Physiotherapy / tens treatment row shown in assessment details and recommendation boxes. */
export interface ActiveTreatmentRow {
  id: number;
  treatmentType: "physiotherapy" | "tens";
  bodyLocation: string;
  plannedSessions: number;
  completedSessions: number;
  color?: string;
  status: string;
}

/** Format active treatment rows for display (locations, colors, planned session counts). */
export const formatActiveTreatmentRows = (
  rows: ActiveTreatmentRow[],
): string[] => {
  if (rows.length === 0) return [];

  return rows.map((row) => {
    const location = row.bodyLocation || "não especificado";
    const color = row.color ? ` (cor: ${row.color})` : "";
    const sessionsText =
      row.plannedSessions === 1 ? "1 sessão" : `${row.plannedSessions} sessões`;
    return `${sessionsText} - ${location}${color}`;
  });
};

// Helper: Render recommendation item
interface RecommendationItemProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

export const RecommendationItem: React.FC<RecommendationItemProps> = ({
  icon,
  label,
  value,
  fullWidth = false,
}) => (
  <div
    className={`flex items-start justify-between p-2 bg-gray-50 rounded border border-gray-200 ${
      fullWidth ? "sm:col-span-2" : ""
    }`}
  >
    <span className="text-gray-600 font-medium text-nowrap">
      {icon} {label}:
    </span>
    <span className="text-gray-800 ml-2 text-right">{value}</span>
  </div>
);
