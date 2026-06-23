import React from "react";
import { PatientResponseDto } from "@/api/types";

interface ExpandedAssessmentDetailsProps {
  patient: PatientResponseDto | null;
  patientName: string;
  notes?: string; // Attendance notes
}

/**
 * ExpandedAssessmentDetails - Shows assessment consultation details
 *
 * Displays:
 * - Main concern (from patient record)
 * - Attendance notes (if any)
 */
const ExpandedAssessmentDetails: React.FC<ExpandedAssessmentDetailsProps> = ({
  patient,
  notes,
}) => {
  if (!patient) {
    return (
      <div className="p-3 bg-gray-50 rounded text-sm text-gray-500 italic">
        No patient record found
      </div>
    );
  }

  const hasMainConcern = patient.mainConcern && patient.mainConcern.trim();
  const hasNotes = notes && notes.trim();

  if (!hasMainConcern && !hasNotes) {
    return (
      <div className="p-3 bg-gray-50 rounded text-sm text-gray-500 italic">
        No complaint or notes recorded
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
      {/* Main Concern */}
      {hasMainConcern && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="font-semibold text-gray-700 mb-1">Main complaint</div>
          <div className="text-gray-800 whitespace-pre-wrap font-normal leading-tight">
            {patient.mainConcern}
          </div>
        </div>
      )}

      {/* Attendance Notes */}
      {hasNotes && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="font-semibold text-gray-700 mb-1">Notes</div>
          <div className="text-gray-800 whitespace-pre-wrap">{notes}</div>
        </div>
      )}
    </div>
  );
};

export default ExpandedAssessmentDetails;
