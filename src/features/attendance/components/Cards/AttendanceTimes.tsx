import React from "react";
import { AttendanceProgression } from "@/types/types";

interface AttendanceTimesProps {
  status: AttendanceProgression;
  checkedInTime?: string | null;
  onGoingTime?: string | null;
  completedTime?: string | null;
}

function formatDisplayTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}

const AttendanceTimes: React.FC<AttendanceTimesProps> = ({
  status,
  checkedInTime,
  onGoingTime,
}) => {
  const shouldShowCheckedIn = status !== "scheduled" && checkedInTime;
  const shouldShowOnGoing =
    !["scheduled", "checkedIn"].includes(status) && onGoingTime;

  return (
    <div className="absolute bottom-1.5 left-2 flex justify-between text-xs w-full">
      <span className="text-gray-500">
        {shouldShowCheckedIn && `check-in: ${formatDisplayTime(checkedInTime)}`}
      </span>
      <span className="mx-auto text-gray-500">
        {shouldShowOnGoing && `attendance: ${formatDisplayTime(onGoingTime)}`}
      </span>
    </div>
  );
};

export default AttendanceTimes;
