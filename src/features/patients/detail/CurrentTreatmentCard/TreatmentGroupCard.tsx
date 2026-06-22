import React from "react";
import { getColorCodeWithOpacity } from "@/utils/treatmentColors";
import { TreatmentProgressBar } from "./TreatmentProgressBar";
import { Button } from "@/components/ui";

/** One grouped row of treatment plan(s) shown in `ActiveTreatments`. */
export interface TreatmentGroup {
  id?: number;
  treatmentType: "physiotherapy" | "tens";
  bodyLocation?: string;
  bodyLocations?: string[];
  sessionIds?: number[];
  plannedSessions: number;
  completedSessions: number;
  status: string;
  durationMinutes?: number;
  color?: string;
  sessions?: Array<{ status: string; scheduledDate?: string }>;
}

interface TreatmentGroupCardProps {
  group: TreatmentGroup;
  onDelete: (sessionIds: number[], sessionType: string) => void;
  isDeleting: boolean;
  onEdit?: () => void;
  canEdit?: boolean;
}

const getSessionDetails = (
  sessionRows?: Array<{ status: string; scheduledDate?: string }>,
  bodyLocationsCount = 0,
) => {
  if (!sessionRows) return { upcoming: 0, missed: 0, cancelled: 0 };

  const detailsCount = {
    upcoming: sessionRows.filter((row) => row.status === "scheduled").length,
    missed: sessionRows.filter((row) => row.status === "missed").length,
    cancelled: sessionRows.filter((row) => row.status === "cancelled").length,
  };

  if (bodyLocationsCount > 0) {
    if (detailsCount.upcoming)
      detailsCount.upcoming = detailsCount.upcoming / bodyLocationsCount;
    if (detailsCount.missed)
      detailsCount.missed = detailsCount.missed / bodyLocationsCount;
    if (detailsCount.cancelled)
      detailsCount.cancelled = detailsCount.cancelled / bodyLocationsCount;
  }

  return detailsCount;
};

const getTreatmentConfig = (type: "physiotherapy" | "tens") => {
  const configs = {
    physiotherapy: {
      name: "Physiotherapy",
      bgColor: "bg-white",
      borderColor: "border-gray-200 border-l-4 border-l-yellow-500",
    },
    tens: {
      name: "TENS",
      bgColor: "bg-white",
      borderColor: "border-gray-200 border-l-4 border-l-blue-500",
    },
  };

  return configs[type];
};

export const TreatmentGroupCard: React.FC<TreatmentGroupCardProps> = ({
  group,
  onDelete,
  isDeleting,
  onEdit,
  canEdit = false,
}) => {
  const config = getTreatmentConfig(group.treatmentType);

  const bodyLocations =
    group.bodyLocations ||
    (group.bodyLocation ? [group.bodyLocation] : ["Location not specified"]);
  const treatmentIds = group.sessionIds || (group.id ? [group.id] : []);
  const isGrouped = bodyLocations.length > 1;

  const locationText =
    bodyLocations.length > 8
      ? `${bodyLocations.slice(0, 8).join(", ")} +${bodyLocations.length - 8} more`
      : bodyLocations.join(", ");

  return (
    <div
      className={`${config.bgColor} rounded-lg p-3 border ${config.borderColor}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 capitalize">
            {locationText} - {group.plannedSessions} sessions
            {isGrouped && ` (${bodyLocations.length} locations)`}
          </span>
          {group.color && (
            <span
              className="text-xs text-gray-800 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: getColorCodeWithOpacity(group.color, 0.25),
              }}
            >
              {group.color}
            </span>
          )}
          {group.durationMinutes && (
            <span className="text-xs text-gray-500">
              {group.durationMinutes}{" "}
              {group.durationMinutes > 1 ? "minutes" : "minute"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={canEdit ? onEdit : undefined}
            disabled={!canEdit}
            className="h-auto min-h-0 px-2 py-1 text-xs text-blue-700 hover:text-blue-800"
            title={
              canEdit
                ? "Edit treatment"
                : "This treatment already has completed sessions and cannot be edited."
            }
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onDelete(treatmentIds, config.name)}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700"
            title={isGrouped ? "Cancel all treatments" : "Cancel treatment"}
          >
            Cancel treatment{isGrouped ? "s" : ""}
          </Button>
        </div>
      </div>
      <TreatmentProgressBar
        completed={group.completedSessions}
        total={group.plannedSessions}
        treatmentType={group.treatmentType}
        sessionDetails={getSessionDetails(group.sessions, bodyLocations.length)}
        size="sm"
        showDetails={true}
      />
    </div>
  );
};
