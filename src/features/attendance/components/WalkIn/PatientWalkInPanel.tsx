"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import PatientWalkInForm from "./PatientWalkInForm";
import { Priority } from "@/types/types";
import { useDayFinalizationStatus } from "@/api/query/hooks/useDayFinalizationQueries";
import {
  useScheduleSettingByDay,
  hasSlotsForWalkIn,
} from "@/api/query/hooks/useScheduleSettingQueries";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import { useSelectedDate } from "@/stores";
import { getDayOfWeekFromDateString } from "@/utils/scheduleTreatmentSlots";
import { Card } from "@/components/ui";

interface PatientWalkInPanelProps {
  onRegisterNewAttendance?: (
    patientName: string,
    types: string[],
    isNew: boolean,
    priority: Priority,
  ) => void;
}

const PatientWalkInPanel: React.FC<PatientWalkInPanelProps> = ({
  onRegisterNewAttendance,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { getTodayDate } = useDateHelpers();
  const selectedDate = useSelectedDate();
  const dayOfWeek = useMemo(
    () => (selectedDate ? getDayOfWeekFromDateString(selectedDate) : 0),
    [selectedDate],
  );

  const { data: finalizationStatus } = useDayFinalizationStatus(selectedDate);
  const { data: scheduleSetting, isLoading: isLoadingSchedule } =
    useScheduleSettingByDay(dayOfWeek);

  const isDayFinalized = finalizationStatus?.isFinalized ?? false;
  const hasSlots = hasSlotsForWalkIn(scheduleSetting);
  const noSlotsForDay = !isLoadingSchedule && !hasSlots;
  const isNotToday = selectedDate !== getTodayDate();
  const isDisabled = isDayFinalized || noSlotsForDay || isNotToday;

  const handleSuccessfulCheckIn = (
    patientName: string,
    types: string[],
    isNew: boolean,
    priority: Priority,
  ) => {
    // Call parent callback
    if (onRegisterNewAttendance) {
      onRegisterNewAttendance(patientName, types, isNew, priority);
    }

    // Optionally collapse the panel after successful check-in
    setIsExpanded(false);
  };

  useEffect(() => {
    if (isDisabled) {
      setIsExpanded(false);
    }
  }, [isDisabled]);

  return (
    <Card
      className={isDisabled ? "opacity-50" : ""}
      data-testid="patient-walk-in-panel"
    >
      {/* Header with toggle button */}
      <div
        className={`p-4 border-b border-gray-100 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} hover:bg-gray-50 transition-colors duration-200`}
        onClick={() => setIsExpanded(!isExpanded && !isDisabled)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Plus className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Walk-In Patients
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {noSlotsForDay ? (
                  <>There are no available slots for this day.</>
                ) : isNotToday ? (
                  <>Available only for today&apos;s date.</>
                ) : (
                  <>
                    Unscheduled patient registration for{" "}
                    <strong>WALK-IN</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expandable content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <PatientWalkInForm
          onRegisterNewAttendance={handleSuccessfulCheckIn}
          isDropdown={true}
        />
      </div>
    </Card>
  );
};

export default PatientWalkInPanel;
