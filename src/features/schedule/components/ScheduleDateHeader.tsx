import React from "react";
import { formatDisplayDateWithDayOfWeek } from "@/utils/dateUtils";
import HolidayIndicator from "./HolidayIndicator";
import { useHolidayForDate } from "../hooks/useHolidayForDate";

interface ScheduleDateHeaderProps {
  date: string; // YYYY-MM-DD format
}

/**
 * ScheduleDateHeader - Displays date with optional holiday indicator
 */
const ScheduleDateHeader: React.FC<ScheduleDateHeaderProps> = ({ date }) => {
  const { holiday } = useHolidayForDate(date);

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <div className="font-semibold">{formatDisplayDateWithDayOfWeek(date)}</div>
        {holiday && (
          <div className="mt-1">
            <HolidayIndicator
              holidayName={holiday.name}
              description={holiday.description}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleDateHeader;
