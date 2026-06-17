import React, { useMemo } from "react";
import { formatDateBR } from "@/utils/dateUtils";
import { getColorCodeWithOpacity } from "@/utils/treatmentColors";
import type { CreatedTreatment } from "../CreatedTreatmentsConfirmation";
import { ScheduledAppointmentsPreview } from "./ScheduledAppointmentsPreview";
import {
  groupCreatedTreatmentsForDisplay,
  type GroupedCreatedTreatment,
} from "./CreatedTreatmentGroup.utils";

interface CreatedTreatmentGroupProps {
  treatments: CreatedTreatment[];
  title: string;
  getScheduledDates: (
    treatment: CreatedTreatment,
  ) => Array<{ date: string; time?: string }>;
}

function formatDuration(durationInUnits?: number): string {
  if (!durationInUnits) return "";
  const minutes = durationInUnits * 7;
  return `${minutes} min`;
}

function mergeScheduledDates(
  group: GroupedCreatedTreatment,
  getScheduledDates: (
    treatment: CreatedTreatment,
  ) => Array<{ date: string; time?: string }>,
): Array<{ date: string; time?: string }> {
  const seen = new Set<string>();
  const merged: Array<{ date: string; time?: string }> = [];
  for (const treatment of group.treatments) {
    const dates = getScheduledDates(treatment);
    for (const d of dates) {
      const key = d.time ? `${d.date}-${d.time}` : d.date;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(d);
      }
    }
  }
  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * CreatedTreatmentGroup — physiotherapy or tens block: groups created treatments that
 * differ only by body location (shared color, duration, planned count, start date).
 */
export const CreatedTreatmentGroup: React.FC<CreatedTreatmentGroupProps> = ({
  treatments,
  title,
  getScheduledDates,
}) => {
  const groups = useMemo(
    () => groupCreatedTreatmentsForDisplay(treatments),
    [treatments],
  );

  if (treatments.length === 0) {
    return null;
  }

  const totalLocations = treatments.length;

  return (
    <div
      className={`border-l-4 ${title === "Physiotherapy" ? "border-l-yellow-400" : "border-l-blue-400"} rounded-lg p-4 space-y-3`}
    >
      <h4
        className={`text-lg font-semibold border-b pb-4 ${title === "Physiotherapy" ? "border-yellow-500" : "border-blue-500"}`}
      >
        <span>{title}</span>
        <span className="text-sm text-gray-500 ml-2">
          ({totalLocations} {totalLocations === 1 ? "local" : "locais"})
        </span>
      </h4>

      <div
        className={`divide-y divide-gray-300 [&>*]:py-6 first:[&>*]:pt-0 last:[&>*]:pb-6`}
      >
        {groups.map((group) => {
          const rep = group.representativeSession;
          const scheduledDatesData = mergeScheduledDates(
            group,
            getScheduledDates,
          );
          const bodyLocationsLabel = group.bodyLocations
            .map((loc) => loc.charAt(0).toUpperCase() + loc.slice(1))
            .join(", ");

          return (
            <div
              key={getGroupKeyForRender(rep, group.bodyLocations)}
              className=""
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 gap-1 flex flex-col text-sm text-gray-800">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {group.bodyLocations.length > 1 ? "Locais:" : "Local:"}
                    </span>
                    <span className="text-sm text-gray-700">
                      {bodyLocationsLabel}
                    </span>
                  </div>

                  {rep.treatmentType === "physiotherapy" && (
                    <>
                      {rep.color && (
                        <span className="flex items-center space-x-1">
                          <span className={`text-sm font-medium text-gray-900`}>
                            Cor:
                          </span>
                          <span
                            className="px-2 py-1/2 rounded-md"
                            style={{
                              backgroundColor: getColorCodeWithOpacity(
                                rep.color,
                                0.25,
                              ),
                            }}
                          >
                            {rep.color}
                          </span>
                        </span>
                      )}
                      {rep.durationMinutes !== undefined &&
                        rep.durationMinutes !== null && (
                          <span className="flex items-center space-x-1">
                            <span className="text-sm font-medium text-gray-900">
                              Duração:
                            </span>
                            <span>{formatDuration(rep.durationMinutes)}</span>
                          </span>
                        )}
                    </>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-md font-semibold text-gray-900">
                    {rep.plannedSessions}{" "}
                    {rep.plannedSessions === 1 ? "sessão" : "sessões"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Início: {formatDateBR(rep.startDate)}
                  </div>
                </div>
              </div>

              <ScheduledAppointmentsPreview
                scheduledDates={scheduledDatesData}
                createdDate={rep.startDate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

function getGroupKeyForRender(
  rep: CreatedTreatment,
  bodyLocations: string[],
): string {
  return `${rep.id}-${bodyLocations.join("-")}`;
}
