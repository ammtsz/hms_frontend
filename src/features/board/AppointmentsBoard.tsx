"use client";

import React, { useMemo } from "react";
import { Priority } from "../../types/types";
import { useOpenViewCompletedConsultation } from "@/stores/modalStore";
import { ModalRegistry } from "./components/Modals";

import { useBoardData } from "./hooks/useBoardData";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useBoardWorkflow } from "./hooks/useBoardWorkflow";
import { useExternalCheckIn } from "./hooks/useExternalCheckIn";
import { useBoardState } from "@/features/board/hooks/useBoardState";
import {
  useScheduleSettingByDay,
  hasSlotsForWalkIn,
} from "@/api/query/hooks/useScheduleSettingQueries";
import { useBoardHolidayForDate } from "@/features/board/hooks/useBoardHolidayForDate";
import { getDayOfWeekFromDateString } from "@/utils/scheduleTreatmentSlots";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";
import {
  hasAppointmentsOnDate,
  ALL_SECTIONS_COLLAPSED,
} from "./utils/appointmentDataUtils";

// Components
import { LoadingState, ErrorState } from "./components/Board/StateComponents";
import { AppointmentsBoardHeader } from "./components/Board/AppointmentsBoardHeader";
import { MobileDesktopDnDAlert } from "./components/Board/MobileDesktopDnDAlert";
import { AppointmentSections } from "./components/Board/AppointmentSections";
import { TreatmentWorkflowButtons } from "./components/Board/TreatmentWorkflowButtons";

const AppointmentsBoard: React.FC<{
  unscheduledCheckIn?: {
    name: string;
    types: string[];
    isNew: boolean;
    priority?: Priority;
  } | null;
  onCheckInProcessed?: () => void;
}> = ({ unscheduledCheckIn, onCheckInProcessed }) => {
  const { loading, error, refreshData, appointmentsByDate } =
    useBoardData();

  const { selectedDate, setSelectedDate } = useBoardState();

  const dayOfWeek = useMemo(
    () => (selectedDate ? getDayOfWeekFromDateString(selectedDate) : 0),
    [selectedDate],
  );
  const { data: scheduleSetting, isLoading: isLoadingSchedule } =
    useScheduleSettingByDay(dayOfWeek);
  const noSlotsForDay =
    !isLoadingSchedule && !hasSlotsForWalkIn(scheduleSetting);

  const hasAppointments = useMemo(
    () => hasAppointmentsOnDate(appointmentsByDate),
    [appointmentsByDate],
  );

  const applyNoSlotsRestriction = noSlotsForDay && !hasAppointments;

  const {
    isHolidayForAll,
    holidayMessage,
    isLoading: isLoadingHoliday,
  } = useBoardHolidayForDate(selectedDate ?? null);
  const applyHolidayRestriction =
    !isLoadingHoliday && isHolidayForAll && !hasAppointments;

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
  const { collapsed, isDayFinalized, toggleCollapsed } = useBoardWorkflow({
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
    appointmentId: number,
    patientId: number,
    patientName: string,
  ) => {
    openViewCompletedConsultation({ appointmentId, patientId, patientName });
  };

  const isInitialLoad = loading && !appointmentsByDate;

  if (isInitialLoad) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <AppointmentsBoardHeader
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

        <AppointmentSections
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

export default AppointmentsBoard;
