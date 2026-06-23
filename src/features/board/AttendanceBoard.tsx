"use client";

import React, { useMemo } from "react";
import { Priority } from "../../types/types";
import { useOpenViewCompletedConsultation } from "@/stores/modalStore";
import { ModalRegistry } from "./components/Modals";

import { useAttendanceData } from "./hooks/useAttendanceData";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useAttendanceWorkflow } from "./hooks/useAttendanceWorkflow";
import { useExternalCheckIn } from "./hooks/useExternalCheckIn";
import { useAttendanceBoardState } from "@/features/board/hooks/useAttendanceBoardState";
import {
  useScheduleSettingByDay,
  hasSlotsForWalkIn,
} from "@/api/query/hooks/useScheduleSettingQueries";
import { useAttendanceHolidayForDate } from "@/features/board/hooks/useAttendanceHolidayForDate";
import { getDayOfWeekFromDateString } from "@/utils/scheduleTreatmentSlots";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";
import {
  hasAttendancesOnDate,
  ALL_SECTIONS_COLLAPSED,
} from "./utils/attendanceDataUtils";

// Components
import { LoadingState, ErrorState } from "./components/Board/StateComponents";
import { AttendanceHeader } from "./components/Board/AttendanceHeader";
import { MobileDesktopDnDAlert } from "./components/Board/MobileDesktopDnDAlert";
import { AttendanceSections } from "./components/Board/AttendanceSections";
import { TreatmentWorkflowButtons } from "./components/Board/TreatmentWorkflowButtons";

const AttendanceBoard: React.FC<{
  unscheduledCheckIn?: {
    name: string;
    types: string[];
    isNew: boolean;
    priority?: Priority;
  } | null;
  onCheckInProcessed?: () => void;
}> = ({ unscheduledCheckIn, onCheckInProcessed }) => {
  const { loading, error, refreshData, attendancesByDate } =
    useAttendanceData();

  const { selectedDate, setSelectedDate } = useAttendanceBoardState();

  const dayOfWeek = useMemo(
    () => (selectedDate ? getDayOfWeekFromDateString(selectedDate) : 0),
    [selectedDate],
  );
  const { data: scheduleSetting, isLoading: isLoadingSchedule } =
    useScheduleSettingByDay(dayOfWeek);
  const noSlotsForDay =
    !isLoadingSchedule && !hasSlotsForWalkIn(scheduleSetting);

  const hasAttendances = useMemo(
    () => hasAttendancesOnDate(attendancesByDate),
    [attendancesByDate],
  );

  const applyNoSlotsRestriction = noSlotsForDay && !hasAttendances;

  const {
    isHolidayForAll,
    holidayMessage,
    isLoading: isLoadingHoliday,
  } = useAttendanceHolidayForDate(selectedDate ?? null);
  const applyHolidayRestriction =
    !isLoadingHoliday && isHolidayForAll && !hasAttendances;

  const { data: prioritiesData } = usePriorities();

  const priorityLegendEntries = useMemo(() => {
    return prioritiesData?.map((p) => [p.value, p.label || p.value]) ?? [];
  }, [prioritiesData]);

  const {
    dragged,
    handleDragStart,
    handleDragEnd,
    handleDropWithConfirm,
    getPatients,
  } = useDragAndDrop();

  // Workflow management hook
  const { collapsed, isDayFinalized, toggleCollapsed } = useAttendanceWorkflow({
    hasSlotsForDay: !noSlotsForDay,
  });

  const isDayDisabled =
    isDayFinalized || applyNoSlotsRestriction || applyHolidayRestriction;

  const effectiveCollapsed =
    applyNoSlotsRestriction || applyHolidayRestriction
      ? ALL_SECTIONS_COLLAPSED
      : collapsed;
  const effectiveToggleCollapsed =
    applyNoSlotsRestriction || applyHolidayRestriction
      ? () => {}
      : toggleCollapsed;

  // External check-in hook
  useExternalCheckIn({
    unscheduledCheckIn,
    onCheckInProcessed,
  });

  const openViewCompletedConsultation = useOpenViewCompletedConsultation();

  const handleCompletedClick = (
    attendanceId: number,
    patientId: number,
    patientName: string,
  ) => {
    openViewCompletedConsultation({ attendanceId, patientId, patientName });
  };

  const isInitialLoad = loading && !attendancesByDate;

  if (isInitialLoad) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <AttendanceHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        isDayFinalized={isDayFinalized}
        noSlotsForDay={applyNoSlotsRestriction}
        holidayForDay={holidayMessage}
        isDayDisabledByHoliday={applyHolidayRestriction}
        onRefresh={refreshData}
      />

      <MobileDesktopDnDAlert show={!isDayDisabled} />

      <div
        className={
          applyNoSlotsRestriction || applyHolidayRestriction
            ? "opacity-50 pointer-events-none transition-opacity duration-200"
            : "transition-opacity duration-200"
        }
      >
        {/* Priority Legend */}
        <div className="border-b border-gray-200 mb-4 opacity-80">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-4">
            <span className="font-semibold text-gray-800">
              Priority legend:
            </span>
            <div className="flex flex-wrap gap-4 text-sm">
              {priorityLegendEntries.map(([code, label]) => (
                <span key={code}>
                  <span className="font-bold">{code}</span>: {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <AttendanceSections
          collapsed={effectiveCollapsed}
          getPatients={getPatients}
          dragged={dragged}
          handleDragStart={isDayDisabled ? () => {} : handleDragStart}
          handleDragEnd={isDayDisabled ? () => {} : handleDragEnd}
          handleDropWithConfirm={
            isDayDisabled ? () => {} : handleDropWithConfirm
          }
          toggleCollapsed={effectiveToggleCollapsed}
          isDayFinalized={isDayFinalized}
          onCompletedClick={handleCompletedClick}
        />

        <TreatmentWorkflowButtons
          isDayFinalized={isDayFinalized}
          noSlotsForDay={applyNoSlotsRestriction || applyHolidayRestriction}
          selectedDate={selectedDate}
        />
      </div>

      <ModalRegistry onRefresh={refreshData} />
    </div>
  );
};

export default AttendanceBoard;
