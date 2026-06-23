import React from "react";
import AppointmentTypeTag from "@/features/board/components/Cards/AppointmentTypeTag";
import { AppointmentType } from "@/types/types";
import { AppointmentStatus } from "@/api/types";
import Spinner from "@/components/common/Spinner";
import ScheduleDateHeader from "./ScheduleDateHeader";
import { useOpenCancellation } from "@/stores/modalStore";
import ScheduleAppointmentStatusIcon from "./ScheduleAppointmentStatusIcon";
import { Button } from "@/components/ui";
import { SCHEDULE_COLUMN_MESSAGES } from "../utils/scheduleFilterConstants";

interface Patient {
  id: string;
  name: string;
  appointmentId?: number;
  appointmentType: AppointmentType;
  appointmentStatus?: AppointmentStatus;
}

interface PatientWithTreatmentsCounts {
  id: string;
  name: string;
  appointmentType: AppointmentType;
  /** Resolved row status (defaults to scheduled when missing on raw patient) */
  appointmentStatus: AppointmentStatus;
  appointmentIds: number[];
  physiotherapy: number;
  tens: number;
}

interface ScheduleItem {
  date: string; // YYYY-MM-DD format
  patients: Patient[];
}

interface ScheduleColumnProps {
  title: string;
  scheduleItems: ScheduleItem[];
  openScheduleIdx: number[];
  setOpenScheduleIdx: (indices: number[]) => void;
  columnType: "assessment" | "physiotherapy";
  isLoading?: boolean;
  isRefreshing?: boolean;
}

function patientNameTextClass(status: AppointmentStatus): string {
  if (
    status === AppointmentStatus.COMPLETED ||
    status === AppointmentStatus.MISSED ||
    status === AppointmentStatus.CANCELLED
  ) {
    return "font-medium text-gray-500 line-clamp-2";
  }
  return "font-medium text-gray-800 line-clamp-2";
}

const ScheduleColumn: React.FC<ScheduleColumnProps> = ({
  title,
  scheduleItems,
  openScheduleIdx,
  setOpenScheduleIdx,
  columnType,
  isLoading = false,
  isRefreshing = false,
}) => {
  const openCancellation = useOpenCancellation();
  const allIndices = scheduleItems.map((_, idx) => idx);
  const allExpanded =
    scheduleItems.length > 0 && openScheduleIdx.length === scheduleItems.length;
  const handleToggleAll = () => {
    setOpenScheduleIdx(allExpanded ? [] : allIndices);
  };

  const getPatientsWithTreatmentsCounts = (patients: Patient[]) => {
    const groupedPatients = patients.reduce(
      (acc: PatientWithTreatmentsCounts[], patient: Patient) => {
        const rowStatus =
          patient.appointmentStatus ?? AppointmentStatus.SCHEDULED;
        const existingPatient = acc.find(
          (p) => p.id === patient.id && p.appointmentStatus === rowStatus,
        );

        if (existingPatient) {
          if (patient.appointmentId) {
            existingPatient.appointmentIds.push(patient.appointmentId);
          }

          if (patient.appointmentType === "physiotherapy") {
            existingPatient.physiotherapy += 1;
          } else if (patient.appointmentType === "tens") {
            existingPatient.tens += 1;
          }
        } else {
          acc.push({
            id: patient.id,
            name: patient.name,
            appointmentType: patient.appointmentType,
            appointmentStatus: rowStatus,
            appointmentIds: patient.appointmentId ? [patient.appointmentId] : [],
            physiotherapy: patient.appointmentType === "physiotherapy" ? 1 : 0,
            tens: patient.appointmentType === "tens" ? 1 : 0,
          });
        }
        return acc;
      },
      [],
    );

    return groupedPatients;
  };

  return (
    <div
      className={`flex-1 border border-gray-200 shadow rounded-lg p-4 bg-white relative ${
        isRefreshing ? "opacity-75" : ""
      }`}
    >
      {isRefreshing && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg z-10">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md border">
            <Spinner size="sm" className="text-blue-500" />
            <span className="text-sm text-gray-600">{SCHEDULE_COLUMN_MESSAGES.refreshing}</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {scheduleItems.length} date{scheduleItems.length !== 1 ? "s" : ""}{" "}
              with appointments
            </p>
          </div>
          {scheduleItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] w-full shrink-0 sm:w-auto"
              onClick={handleToggleAll}
              aria-label={
                allExpanded
                  ? "Collapse all appointments in column"
                  : "Expand all appointments in column"
              }
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </Button>
          )}
        </div>
      </div>

      {scheduleItems.length > 0 ? (
        scheduleItems.map(({ date, patients }, idx: number) => {
          const isExpanded = openScheduleIdx.includes(idx);
          const patientsWithTreatmentsCounts =
            getPatientsWithTreatmentsCounts(patients);

          return (
            <div
              key={date + "-" + columnType + "-" + idx}
              className={`mb-4 border border-gray-200 rounded-lg shadow-sm ${
                !isExpanded ? "bg-white" : "bg-gray-100"
              }`}
            >
              <Button
                variant="ghost"
                className="h-auto min-h-[44px] w-full justify-between rounded-t-lg p-4 text-gray-800 hover:bg-gray-50"
                onClick={() => {
                  if (isExpanded) {
                    setOpenScheduleIdx(
                      openScheduleIdx.filter((openIdx) => openIdx !== idx),
                    );
                    return;
                  }
                  setOpenScheduleIdx([...openScheduleIdx, idx]);
                }}
                aria-expanded={isExpanded}
                aria-controls={`schedule-patients-${columnType}-${idx}`}
              >
                <span className="text-left w-full">
                  <ScheduleDateHeader date={date} />
                  <div className="text-sm text-gray-600 mt-1">
                    {patientsWithTreatmentsCounts.length} patient
                    {patientsWithTreatmentsCounts.length !== 1 ? "s" : ""}{" "}
                    scheduled
                  </div>
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`ml-2 transition-transform text-gray-400 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  >
                    ▶
                  </span>
                </div>
              </Button>
              {isExpanded && (
                <div
                  id={`schedule-patients-${columnType}-${idx}`}
                  className="p-4 pt-0 border-t border-gray-200 bg-gray-100"
                >
                  <div className="space-y-2 mt-4">
                    {patientsWithTreatmentsCounts.map(
                      ({
                        name,
                        id,
                        appointmentIds,
                        physiotherapy,
                        tens,
                        appointmentStatus,
                      }) => (
                        <div
                          key={`${id}-${appointmentStatus}`}
                          className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-sm sm:flex-row sm:items-center"
                        >
                          <ScheduleAppointmentStatusIcon
                            status={appointmentStatus}
                            className="shrink-0"
                          />
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            <span
                              className={patientNameTextClass(appointmentStatus)}
                            >
                              {name}
                            </span>
                            {columnType == "physiotherapy" && (
                              <div className="flex shrink-0 flex-wrap items-end gap-2 sm:ml-auto">
                                {physiotherapy > 0 && (
                                  <AppointmentTypeTag
                                    type="physiotherapy"
                                    count={physiotherapy}
                                  />
                                )}
                                {tens > 0 && (
                                  <AppointmentTypeTag type="tens" count={tens} />
                                )}
                              </div>
                            )}
                          </div>
                          {appointmentStatus === AppointmentStatus.SCHEDULED ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-h-[44px] w-full shrink-0 text-gray-600 hover:text-gray-800 sm:w-auto"
                              onClick={() =>
                                openCancellation(appointmentIds, name, date)
                              }
                              aria-label="Manage appointment"
                            >
                              Manage
                            </Button>
                          ) : null}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      ) : isLoading ? (
        <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-lg">
          <div className="flex flex-col items-center justify-center">
            <Spinner size="md" className="text-blue-500 mb-3" />
            <div className="text-sm">{SCHEDULE_COLUMN_MESSAGES.loading}</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm">
            {columnType === "assessment"
              ? SCHEDULE_COLUMN_MESSAGES.emptyAssessment
              : SCHEDULE_COLUMN_MESSAGES.emptyPhysiotherapy}
          </div>
          <div className="text-xs mt-1">
            {SCHEDULE_COLUMN_MESSAGES.emptyHint}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleColumn;
