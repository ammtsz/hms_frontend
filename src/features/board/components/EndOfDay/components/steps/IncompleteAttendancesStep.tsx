import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { IAttendanceStatusDetailWithType } from "../../../../utils/attendanceDataUtils";
import {
  getAttendanceTypeLabel,
  getAttendanceStatusLabel,
} from "@/utils/apiTransformers";
import { formatDisplayDate } from "@/utils/dateUtils";
import { Button } from "@/components/ui";

interface IncompleteAttendancesStepProps {
  incompleteAttendances: IAttendanceStatusDetailWithType[];
  selectedDate: string;
  onNext: () => void;
  onCancel: () => void;
}

const IncompleteAttendancesStep: React.FC<IncompleteAttendancesStepProps> = ({
  incompleteAttendances,
  selectedDate,
  onNext,
  onCancel,
}) => {
  return (
    <div className="flex flex-col justify-between min-h-[400px]">
      <h3 className="text-lg font-semibold mb-4">
        Incomplete Attendances - {formatDisplayDate(selectedDate)}
      </h3>

      {incompleteAttendances.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                All attendances were completed!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>There are no incomplete attendances for this day.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Incomplete attendances
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {`There ${incompleteAttendances.length === 1 ? "is" : "are"} ${incompleteAttendances.length} attendance${incompleteAttendances.length === 1 ? "" : "s"} that
                    ${incompleteAttendances.length === 1 ? "was" : "were"} not completed. Go back to the attendances page and
                    drag all patients to the "Scheduled" or
                    "Completed" columns before finalizing the day.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {incompleteAttendances.map((attendance) => (
            <div
              key={`${attendance.attendanceId}-${attendance.attendanceType}`}
              className="border border-gray-200 rounded-md p-4 bg-white"
            >
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {attendance.name}
                </h4>
                <p className="text-sm text-red-500 font-medium">
                  Status:{" "}
                  {getAttendanceStatusLabel(
                    attendance.checkedInTime,
                    attendance.onGoingTime,
                    attendance.completedTime,
                  )}
                </p>
                <p className="text-sm text-gray-600 font-normal">
                  {getAttendanceTypeLabel(attendance.attendanceType)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col-reverse justify-between gap-3 mt-6 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={incompleteAttendances.length > 0}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default IncompleteAttendancesStep;
