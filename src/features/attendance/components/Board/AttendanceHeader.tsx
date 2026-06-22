import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
} from "lucide-react";
import { useUnresolvedPastAttendances } from "@/api/query/hooks/useAttendanceQueries";
import { useOpenUnresolvedPast } from "@/stores/modalStore";
import { useCommittedDateInput } from "@/hooks/useCommittedDateInput";
import {
  addCalendarDaysToLocalYmd,
  getTodayClinic,
} from "@/utils/timezoneDate";
import { Button, Input } from "@/components/ui";

interface AttendanceHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  isDayFinalized?: boolean;
  noSlotsForDay?: boolean;
  /** When set, shows "Holiday for [treatment types]" (e.g. when date is holiday for some or all types) */
  holidayForDay?: string | null;
  /** When true, day is disabled because it is a holiday for all treatment types */
  isDayDisabledByHoliday?: boolean;
  onRefresh?: () => void;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  selectedDate,
  onDateChange,
  isDayFinalized = false,
  noSlotsForDay = false,
  holidayForDay = null,
  isDayDisabledByHoliday = false,
  onRefresh,
}) => {
  const { data: unresolvedData, isLoading: unresolvedLoading } =
    useUnresolvedPastAttendances();
  const openUnresolvedPast = useOpenUnresolvedPast();

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
    onCommit: onDateChange,
  });

  const handleCheckUnresolved = () => {
    if (unresolvedData?.hasUnresolved && unresolvedData.dates.length > 0) {
      openUnresolvedPast(unresolvedData.dates);
    }
  };

  return (
    <div className="w-full pb-4">
      <h2 className="mb-4 flex items-center gap-2 text-lg text-[color:var(--primary-dark)]">
        Selected date:
      </h2>

      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center md:gap-16">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Input
            ref={inputRef}
            type="date"
            className="min-w-0 max-sm:w-full max-sm:basis-full sm:min-w-[180px] sm:flex-1"
            value={draftValue}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onMouseDown={handleMouseDown}
            lang="en-US"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              commitImmediately(addCalendarDaysToLocalYmd(selectedDate, -7))
            }
            title="Go back one week"
            aria-label="Go back one week"
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              commitImmediately(addCalendarDaysToLocalYmd(selectedDate, -1))
            }
            aria-label="Go back one day"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              commitImmediately(addCalendarDaysToLocalYmd(selectedDate, 1))
            }
            aria-label="Advance one day"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              commitImmediately(addCalendarDaysToLocalYmd(selectedDate, 7))
            }
            title="Advance one week"
            aria-label="Advance one week"
          >
            <ChevronsRight />
          </Button>
          <Button
            variant="outline"
            onClick={() => commitImmediately(getTodayClinic())}
          >
            Today
          </Button>
          {onRefresh ? (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              title="Refresh attendances"
              aria-label="Refresh attendances"
            >
              <RefreshCw size={18} />
            </Button>
          ) : null}
        </div>
        <Button
          variant="outline"
          className="relative shrink-0 max-sm:w-full md:self-auto"
          onClick={handleCheckUnresolved}
          disabled={unresolvedLoading}
          title="Check unresolved attendances from past dates"
        >
          {unresolvedData?.hasUnresolved ? (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
          ) : null}
          Pending
        </Button>
      </div>

      {isDayFinalized ? (
        <div className="mb-4 flex items-center gap-2 rounded border border-green-400 bg-green-100 px-4 py-2 text-green-700">
          <span className="text-lg">📅</span>
          <div>
            <strong>Day finalized</strong>
            <p className="text-sm">Cards are disabled for editing</p>
          </div>
        </div>
      ) : null}

      {noSlotsForDay && !isDayFinalized && !isDayDisabledByHoliday ? (
        <div className="mb-4 flex items-center gap-2 rounded border border-amber-400 bg-amber-100 px-4 py-2 text-amber-800">
          <span className="text-lg">📋</span>
          <div>
            <strong>There is no attendance on this day</strong>
            <p className="text-sm">
              There are no appointments available for this date. Change the date
              to find an available time.
            </p>
          </div>
        </div>
      ) : null}

      {holidayForDay ? (
        <div className="mb-4 flex items-center gap-2 rounded border border-sky-400 bg-sky-100 px-4 py-2 text-sky-800">
          <span className="text-lg">🏷️</span>
          <div>
            <strong>{holidayForDay}</strong>
            {isDayDisabledByHoliday ? (
              <p className="mt-0.5 text-sm">
                It is not possible to manage attendances on this date. Select
                another date.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
