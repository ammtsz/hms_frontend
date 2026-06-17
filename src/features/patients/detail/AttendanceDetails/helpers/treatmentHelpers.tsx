import { formatNotes } from "@/utils/attendanceHistoryUtils";
import React from "react";

// Helper: Render body locations
export const renderLocations = (bodyLocations: string[]): React.ReactNode => {
  const label = bodyLocations.length > 1 ? "Locais" : "Local";
  return (
    <>
      <strong>{label}:</strong> {bodyLocations.join(", ")}
      <br />
    </>
  );
};

// Helper: Render sessions info
export const renderSessions = (
  sessionNumber?: string,
  showSessions?: boolean,
  sessionLabel: string = "Sessões",
): React.ReactNode => {
  if (!showSessions || !sessionNumber) return null;
  return (
    <>
      <strong>{sessionLabel}:</strong> {sessionNumber}
      <br />
    </>
  );
};

// Helper: Render notes section with consistent styling
interface NotesBoxProps {
  notes?: string;
  noteType?:
    | "treatment"
    | "session"
    | "assessment"
    | "pre-consultation"
    | "observations"
    | "notes";
  borderColor: "yellow" | "blue" | "red" | "gray" | "purple" | "disabled";
  // sessionNotes?: string;
  // preConsultationNotes?: string;
}

export const NotesBox: React.FC<NotesBoxProps> = ({
  notes,
  // sessionNotes,
  // preConsultationNotes,
  borderColor,
  noteType = "notes",
}) => {
  if (!notes) return null;

  const colorClasses = {
    yellow: "border-yellow-100 bg-yellow-50/60",
    blue: "border-blue-100 bg-blue-50/60",
    gray: "border-gray-400/80 bg-white",
    red: "border-red-300 bg-red-50",
    purple: "border-purple-100 bg-purple-50/60",
    disabled: "border-gray-200 bg-white",
  };

  const label = {
    treatment: "Notas do tratamento",
    session: "Notas da sessão",
    assessment: "Notas da consulta",
    "pre-consultation": "Notas pré-consulta",
    observations: "Observações",
    notes: "Notas",
  };

  return (
    <div
      className={`flex flex-col border p-2 rounded-md mt-2 ${colorClasses[borderColor]} text-xs text-gray-700 leading-loose space-x-4`}
    >
      {notes && (
        <span className="mx-2 whitespace-pre-line">
          <strong>{label[noteType]}:</strong> {formatNotes(notes)}
        </span>
      )}
    </div>
  );
};
