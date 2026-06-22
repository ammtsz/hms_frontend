"use client";

import React, { useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useCommittedDateInput } from "@/hooks/useCommittedDateInput";
import { getTodayClinic } from "@/utils/timezoneDate";
import { SCHEDULE_DAY_WINDOW_OPTIONS, type ScheduleDayWindowDays } from "@/stores";
import { AttendanceStatus } from "@/api/types";
import {
  SCHEDULE_STATUS_CHECKBOX_LABELS,
  ALL_SCHEDULE_FILTER_STATUSES,
  SCHEDULE_FILTER_LABELS,
} from "../utils/scheduleFilterConstants";
import { Button, Checkbox, Input, Select } from "@/components/ui";
import ScheduleAttendanceStatusIcon, {
  SCHEDULE_STATUS_LEGEND_ITEMS,
} from "./ScheduleAttendanceStatusIcon";

const WINDOW_LABELS: Record<ScheduleDayWindowDays, string> = {
  1: "1 day",
  7: "7 days",
  15: "15 days",
  30: "30 days",
  60: "60 days",
  90: "90 days",
};

export interface ScheduleCalendarFiltersProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  scheduleDayWindowDays: ScheduleDayWindowDays;
  setScheduleDayWindowDays: (days: ScheduleDayWindowDays) => void;
  scheduleStatusFilters: AttendanceStatus[];
  setScheduleStatusFilters: (filters: AttendanceStatus[]) => void;
  patientFilter: string;
  setPatientFilter: (value: string) => void;
  refreshSchedule: () => void;
  isRefreshing: boolean;
  rangeSummaryText: string;
}

const ScheduleCalendarFilters: React.FC<ScheduleCalendarFiltersProps> = ({
  selectedDate,
  setSelectedDate,
  scheduleDayWindowDays,
  setScheduleDayWindowDays,
  scheduleStatusFilters,
  setScheduleStatusFilters,
  patientFilter,
  setPatientFilter,
  refreshSchedule,
  isRefreshing,
  rangeSummaryText,
}) => {
  const toggleScheduleStatus = useCallback(
    (status: AttendanceStatus) => {
      if (scheduleStatusFilters.includes(status)) {
        setScheduleStatusFilters(scheduleStatusFilters.filter((s) => s !== status));
      } else {
        setScheduleStatusFilters([...scheduleStatusFilters, status]);
      }
    },
    [scheduleStatusFilters, setScheduleStatusFilters],
  );

  const {
    draftValue,
    inputRef,
    commitImmediately,
    handleKeyDown,
    handleBlur,
    handleMouseDown,
    handleDraftChange,
  } = useCommittedDateInput({
    value: selectedDate,
    onCommit: setSelectedDate,
  });

  return (
    <>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start lg:gap-8">
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_11rem]">
          <div className="w-full">
            <label
              htmlFor="schedule-date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select a date to filter
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="schedule-date"
                ref={inputRef}
                type="date"
                className="flex-1"
                value={draftValue}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onMouseDown={handleMouseDown}
                lang="en-US"
              />
              <Button
                variant="outline"
                onClick={() => commitImmediately(getTodayClinic())}
              >
                Today
              </Button>
            </div>
          </div>

          <div className="w-full">
            <label
              htmlFor="schedule-day-window"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Period
            </label>
            <Select
              id="schedule-day-window"
              value={scheduleDayWindowDays}
              onChange={(e) =>
                setScheduleDayWindowDays(
                  Number(e.target.value) as ScheduleDayWindowDays,
                )
              }
            >
              {SCHEDULE_DAY_WINDOW_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {WINDOW_LABELS[days]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <span className="lg:block hidden">|</span>

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="w-full">
            <label
              htmlFor="schedule-patient-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filter by patient
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="schedule-patient-filter"
                type="text"
                className="flex-1"
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                placeholder="Enter patient name"
                autoComplete="off"
              />
              <Button
                variant="outline"
                onClick={() => setPatientFilter("")}
                disabled={!patientFilter}
              >
                Clear
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={refreshSchedule}
            disabled={isRefreshing}
            className={`mt-0 flex items-center gap-1.5 md:mt-7 ${
              isRefreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={isRefreshing ? "Refreshing..." : "Refresh appointment data"}
          >
            <RefreshCw
              size={16}
              className={`${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="mb-4 space-y-4 w-full">
        <p className="text-xs text-gray-600 mt-4">{rangeSummaryText}</p>

        <fieldset className="border border-gray-200 rounded-lg p-3">
          <legend className="text-sm font-medium text-gray-800 px-1">
            {SCHEDULE_FILTER_LABELS.attendanceStatus}
          </legend>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] px-3 py-2 text-xs sm:min-h-[32px] sm:px-2 sm:py-1"
              onClick={() =>
                setScheduleStatusFilters([...ALL_SCHEDULE_FILTER_STATUSES])
              }
              aria-label="Select all attendance statuses"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] px-3 py-2 text-xs sm:min-h-[32px] sm:px-2 sm:py-1"
              onClick={() => setScheduleStatusFilters([])}
              aria-label="Clear attendance status selection"
            >
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ALL_SCHEDULE_FILTER_STATUSES.map((status) => (
              <label
                key={status}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <Checkbox
                  checked={scheduleStatusFilters.includes(status)}
                  onChange={() => toggleScheduleStatus(status)}
                />
                <span>{SCHEDULE_STATUS_CHECKBOX_LABELS[status]}</span>
              </label>
            ))}
          </div>
          {scheduleStatusFilters.length === 0 ? (
            <p className="text-xs text-amber-800 mt-3 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
              {SCHEDULE_FILTER_LABELS.noStatusSelected}
            </p>
          ) : null}
        </fieldset>

        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3"
          aria-label="Status legend"
        >
          <span className="font-medium text-gray-700">{SCHEDULE_FILTER_LABELS.legend}</span>
          {SCHEDULE_STATUS_LEGEND_ITEMS.map(({ status, label }) => (
            <span key={status} className="inline-flex items-center gap-1">
              <ScheduleAttendanceStatusIcon status={status} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default ScheduleCalendarFilters;
