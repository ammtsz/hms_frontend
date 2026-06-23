import React, { useMemo } from "react";
import AppointmentColumn from "./AppointmentColumn";
import {
  AppointmentProgression,
  AppointmentType,
  AppointmentStatusDetail,
} from "@/types/types";
import { IDraggedItem } from "../../types";
import { groupPatientsByTreatments } from "../../utils/patientGrouping";
import { APPOINTMENT_BOARD_STATUSES } from "../../utils/appointmentDataUtils";
import { useExpandableCards } from "./hooks/useExpandableCards";
import { Button } from "@/components/ui";

const COLUMN_GRID_CLASS =
  "mb-8 grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4";

interface AppointmentSectionsProps {
  collapsed: Record<string, boolean>;
  getPatients: (
    type: AppointmentType,
    status: AppointmentProgression,
  ) => AppointmentStatusDetail[];
  dragged: IDraggedItem | null;
  handleDragStart: (
    type: AppointmentType,
    index: number,
    status: AppointmentProgression,
    patientId?: number,
  ) => void;
  handleDragEnd: () => void;
  handleDropWithConfirm: (
    type: AppointmentType,
    status: AppointmentProgression,
  ) => void;
  toggleCollapsed: (type: AppointmentType) => void;
  isDayFinalized?: boolean;
  onCompletedClick?: (
    appointmentId: number,
    patientId: number,
    patientName: string,
  ) => void;
}

export const AppointmentSections: React.FC<AppointmentSectionsProps> = ({
  collapsed,
  getPatients,
  dragged,
  handleDragStart,
  handleDragEnd,
  handleDropWithConfirm,
  toggleCollapsed,
  isDayFinalized = false,
  onCompletedClick,
}) => {
  // Hook for managing expandable cards
  const { toggleExpansion, isExpanded } = useExpandableCards();

  // Option B: total visible cards (grouped for mixed section) for section titles
  const { assessmentCount, mixedCount } = useMemo(() => {
    let assessment = 0;
    let mixed = 0;
    for (const status of APPOINTMENT_BOARD_STATUSES) {
      assessment += getPatients("assessment", status).length;
      mixed += groupPatientsByTreatments(
        getPatients("physiotherapy", status),
        getPatients("tens", status),
      ).length;
    }
    return { assessmentCount: assessment, mixedCount: mixed };
  }, [getPatients]);

  return (
    <div className="flex flex-col w-full">
      {/* Assessment Section */}
      <div key="assessment" className="w-full">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 w-full justify-start px-2 py-1 font-semibold"
          onClick={() => toggleCollapsed("assessment")}
        >
          {collapsed.assessment ? "▶ " : "▼ "}
          Assessment Consultations ({assessmentCount})
        </Button>
        {!collapsed.assessment && (
          <div className={COLUMN_GRID_CLASS}>
            {(
              [
                "scheduled",
                "checkedIn",
                "onGoing",
                "completed",
              ] as AppointmentProgression[]
            ).map((status) => {
              // For assessment section, just assessment patients
              const assessmentPatients = getPatients("assessment", status).map(
                (patient) => ({
                  ...patient,
                  originalType: "assessment" as AppointmentType,
                }),
              );

              // Get expanded card ID for this specific column/status
              const expandedCardId =
                assessmentPatients.find((p) =>
                  isExpanded(status, p.patientId || 0),
                )?.patientId || null;

              return (
                <AppointmentColumn
                  key={status}
                  status={status}
                  patients={assessmentPatients}
                  dragged={dragged}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  handleDrop={() => handleDropWithConfirm("assessment", status)}
                  isDayFinalized={isDayFinalized}
                  onCompletedClick={onCompletedClick}
                  // Expansion support for assessment consultations
                  expandedCardId={expandedCardId}
                  onToggleExpansion={(patientId) => {
                    // Toggle expansion for this column/status
                    toggleExpansion(status, patientId);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Physiotherapy + TENS Section */}
      <div key="mixed" className="w-full">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 w-full justify-start px-2 py-1 font-semibold"
          onClick={() => {
            // Toggle both physiotherapy and tens together for mixed section
            toggleCollapsed("physiotherapy");
            toggleCollapsed("tens");
          }}
        >
          {collapsed.physiotherapy && collapsed.tens ? "▶ " : "▼ "}
          Physiotherapy and TENS ({mixedCount})
        </Button>

        {!(collapsed.physiotherapy && collapsed.tens) && (
          <>
            {/* Dynamic legend based on available types - only show for non-assessment */}
            <div className="my-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-800">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                Physiotherapy
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                TENS
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                Physiotherapy and TENS
              </span>
            </div>
            <div className={COLUMN_GRID_CLASS}>
              {(
                [
                  "scheduled",
                  "checkedIn",
                  "onGoing",
                  "completed",
                ] as AppointmentProgression[]
              ).map((status) => {
                // Get separate physiotherapy and tens patients
                const physiotherapyPatients = getPatients(
                  "physiotherapy",
                  status,
                );
                const tensPatients = getPatients("tens", status);

                // Group patients by patientId and combine their treatments
                const groupedPatients = groupPatientsByTreatments(
                  physiotherapyPatients,
                  tensPatients,
                );

                // Get expanded card ID for this specific column/status
                const expandedCardId =
                  groupedPatients.find((p) =>
                    isExpanded(status, p.patientId || 0),
                  )?.patientId || null;

                return (
                  <AppointmentColumn
                    key={status}
                    status={status}
                    patients={groupedPatients}
                    dragged={dragged}
                    handleDragStart={handleDragStart}
                    handleDragEnd={handleDragEnd}
                    handleDrop={() => {
                      if (dragged?.type)
                        handleDropWithConfirm(dragged?.type, status);
                    }}
                    isDayFinalized={isDayFinalized}
                    // Expansion support for physiotherapy/tens sections
                    expandedCardId={expandedCardId}
                    onToggleExpansion={(patientId) => {
                      // Toggle expansion for this column/status
                      toggleExpansion(status, patientId);
                    }}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
