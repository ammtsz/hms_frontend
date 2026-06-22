import React from "react";
import { DetailBox } from "./DetailBox";
import {
  renderLocations,
  renderSessions,
  NotesBox,
} from "./helpers/treatmentHelpers";

interface TensDetailsProps {
  bodyLocations: string[];
  sessionNumber?: string;
  showSessions?: boolean;
  sessionLabel?: string;
  notes?: string;
  isAbsent?: boolean;
  attendanceNotes?: string;
}

export const TensDetails: React.FC<TensDetailsProps> = ({
  bodyLocations,
  sessionNumber,
  showSessions = false,
  sessionLabel = "Sessions",
  notes,
  isAbsent,
  attendanceNotes,
}) => (
  <DetailBox variant={isAbsent ? "disabled" : "tens"}>
    {/* Header */}
    <div className="flex items-center gap-2 mb-2">
      <div className="text-sm text-gray-700 font-medium">🪄 TENS</div>
    </div>

    {/* Body Details */}
    <div className="text-xs text-gray-700 leading-loose mb-4">
      {renderLocations(bodyLocations)}
      {renderSessions(sessionNumber, showSessions, sessionLabel)}
      <NotesBox
        notes={notes}
        noteType="treatment"
        borderColor={isAbsent ? "disabled" : "blue"}
      />
      <NotesBox
        notes={attendanceNotes}
        noteType="observations"
        borderColor={isAbsent ? "disabled" : "blue"}
      />
    </div>
  </DetailBox>
);
