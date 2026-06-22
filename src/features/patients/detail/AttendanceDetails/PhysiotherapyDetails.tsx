import React, { useMemo } from "react";
import { getColorCodeWithOpacity } from "@/utils/treatmentColors";
import { DetailBox } from "./DetailBox";
import { renderSessions, NotesBox } from "./helpers/treatmentHelpers";

export interface PhysiotherapyBodyLocationColor {
  bodyLocation: string;
  color?: string;
}

interface PhysiotherapyDetailsProps {
  /** Prefer `bodyLocationsWithColors` from grouped attendance; use `bodyLocations` for simple/test call sites. */
  bodyLocations?: string[];
  bodyLocationsWithColors?: PhysiotherapyBodyLocationColor[];
  color?: string;
  duration?: number;
  sessionNumber?: string;
  showSessions?: boolean;
  sessionLabel?: string;
  notes?: string;
  isAbsent?: boolean;
  attendanceNotes?: string;
}

const resolveDisplayEntries = (
  bodyLocationsWithColors: PhysiotherapyBodyLocationColor[] | undefined,
  bodyLocations: string[] | undefined,
  color: string | undefined,
): PhysiotherapyBodyLocationColor[] => {
  if (
    bodyLocationsWithColors !== undefined &&
    bodyLocationsWithColors.length > 0
  ) {
    return bodyLocationsWithColors;
  }
  const locs = bodyLocations ?? [];
  return locs.map((bodyLocation) => ({
    bodyLocation,
    ...(color !== undefined && color !== "" ? { color } : {}),
  }));
};

const distinctColorsInOrder = (
  entries: PhysiotherapyBodyLocationColor[],
): string[] => {
  const out: string[] = [];
  for (const e of entries) {
    const t = e.color?.trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
};

export const PhysiotherapyDetails: React.FC<PhysiotherapyDetailsProps> = ({
  bodyLocations,
  bodyLocationsWithColors,
  color,
  duration,
  sessionNumber,
  showSessions = false,
  sessionLabel = "Session",
  notes,
  isAbsent,
  attendanceNotes,
}) => {
  const entries = useMemo(
    () => resolveDisplayEntries(bodyLocationsWithColors, bodyLocations, color),
    [bodyLocationsWithColors, bodyLocations, color],
  );

  const distinctColors = useMemo(
    () => distinctColorsInOrder(entries),
    [entries],
  );
  const showPerLocationColorSuffix = distinctColors.length > 1;

  const locationsLabel = entries.length > 1 ? "Locations" : "Location";
  const locationsText = showPerLocationColorSuffix
    ? entries
        .map((e) =>
          e.color?.trim()
            ? `${e.bodyLocation} (${e.color.trim().toLowerCase()})`
            : e.bodyLocation,
        )
        .join(", ")
    : entries.map((e) => e.bodyLocation).join(", ");

  return (
    <DetailBox variant={isAbsent ? "disabled" : "physiotherapy"}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="text-sm text-gray-700 font-medium">✨ Physiotherapy</div>
        {distinctColors.map((colorName) => (
          <span
            key={colorName}
            className="px-2 py-0.5 text-xs text-gray-800 rounded"
            style={{
              backgroundColor: getColorCodeWithOpacity(colorName, 0.25),
            }}
          >
            {colorName}
          </span>
        ))}
      </div>

      <div className="text-xs text-gray-700 leading-loose">
        <strong>{locationsLabel}:</strong> {locationsText}
        <br />
        {renderSessions(sessionNumber, showSessions, sessionLabel)}
        {duration && (
          <>
            <strong>Quantity:</strong> {duration}{" "}
            {duration > 1 ? "units" : "unit"}
            <br />
          </>
        )}
        <NotesBox
          notes={notes}
          noteType="treatment"
          borderColor={isAbsent ? "disabled" : "yellow"}
        />
        <NotesBox
          notes={attendanceNotes}
          noteType="observations"
          borderColor={isAbsent ? "disabled" : "yellow"}
        />
      </div>
    </DetailBox>
  );
};
