import React, { useMemo } from "react";
import { DetailBox } from "./DetailBox";
import { renderSessions, NotesBox } from "./helpers/treatmentHelpers";
import { formatTreatmentDurationMinutes } from "@/constants/treatment";

interface PhysiotherapyDetailsProps {
  bodyLocations?: string[];
  durationMinutes?: number;
  sessionNumber?: string;
  showSessions?: boolean;
  sessionLabel?: string;
  notes?: string;
  isAbsent?: boolean;
  appointmentNotes?: string;
}

export const PhysiotherapyDetails: React.FC<PhysiotherapyDetailsProps> = ({
  bodyLocations,
  durationMinutes,
  sessionNumber,
  showSessions = false,
  sessionLabel = "Session",
  notes,
  isAbsent,
  appointmentNotes,
}) => {
  const locations = useMemo(() => bodyLocations ?? [], [bodyLocations]);
  const locationsLabel = locations.length > 1 ? "Locations" : "Location";
  const locationsText = locations.join(", ");

  return (
    <DetailBox variant={isAbsent ? "disabled" : "physiotherapy"}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="text-sm text-gray-700 font-medium">✨ Physiotherapy</div>
      </div>

      <div className="text-xs text-gray-700 leading-loose">
        <strong>{locationsLabel}:</strong> {locationsText}
        <br />
        {renderSessions(sessionNumber, showSessions, sessionLabel)}
        {durationMinutes != null && (
          <>
            <strong>Duration:</strong>{" "}
            {formatTreatmentDurationMinutes(durationMinutes)}
            <br />
          </>
        )}
        <NotesBox
          notes={notes}
          noteType="treatment"
          borderColor={isAbsent ? "disabled" : "yellow"}
        />
        <NotesBox
          notes={appointmentNotes}
          noteType="observations"
          borderColor={isAbsent ? "disabled" : "yellow"}
        />
      </div>
    </DetailBox>
  );
};
