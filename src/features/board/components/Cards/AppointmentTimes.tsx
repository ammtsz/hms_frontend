import React from "react";
import { AppointmentProgression } from "@/types/types";

interface AppointmentTimesProps {
  status: AppointmentProgression;
  checkedInTime?: string | null;
  onGoingTime?: string | null;
  completedTime?: string | null;
}

function formatDisplayTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}

const AppointmentTimes: React.FC<AppointmentTimesProps> = ({
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
        {shouldShowOnGoing && `started: ${formatDisplayTime(onGoingTime)}`}
      </span>
    </div>
  );
};

export default AppointmentTimes;
