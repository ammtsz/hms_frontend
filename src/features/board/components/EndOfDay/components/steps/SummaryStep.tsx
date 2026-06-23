import React, { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";
import { formatDisplayDate } from "@/utils/dateUtils";
import type { AppointmentType } from "@/types/types";
import type { ProcessEndOfDayResponse } from "@/api/day-finalization";
import {
  groupRescheduledByPatient,
  groupCancelledByPatient,
  groupCouldNotRescheduleByPatient,
} from "../../utils/summaryStepUtils";
import { Button } from "@/components/ui";

interface SummaryStepProps {
  result: ProcessEndOfDayResponse;
  selectedDate: string;
  onConclude: () => void;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
  result,
  selectedDate,
  onConclude,
}) => {
  const groupedRescheduled = useMemo(
    () =>
      groupRescheduledByPatient(
        result.rescheduled.filter((item) => item.oldDate !== item.newDate),
      ),
    [result.rescheduled],
  );

  const groupedCancelled = useMemo(
    () => groupCancelledByPatient(result.cancelledForC),
    [result.cancelledForC],
  );

  const groupedNotRescheduled = useMemo(
    () => groupCouldNotRescheduleByPatient(result.couldNotReschedule),
    [result.couldNotReschedule],
  );

  const hasAnyAction =
    groupedRescheduled.length > 0 ||
    result.statusChangedToC.length > 0 ||
    groupedCancelled.length > 0 ||
    groupedNotRescheduled.length > 0;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-6 w-6 text-green-600" />
        Day finalized - {formatDisplayDate(selectedDate)}
      </h3>

      {!hasAnyAction ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
          <p className="text-gray-600">
            Day finalized successfully. No automatic action was needed.
          </p>
        </div>
      ) : (
        <div className="space-y-6 mb-6">
          {groupedRescheduled.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h4 className="text-md font-medium text-green-800 mb-3">
                Rescheduled
              </h4>
              <ul className="space-y-4">
                {groupedRescheduled.map(
                  ({ patientName, patientId, appointments }) => (
                    <li key={patientId} className="text-sm text-green-700">
                      <div className="font-medium">• {patientName}</div>
                      <ul className="ml-4 mt-1 space-y-1">
                        {appointments.map((item) => (
                          <li
                            key={`${item.type}|${item.oldDate}|${item.newDate}`}
                          >
                            {getAppointmentTypeLabel(
                              item.type as AppointmentType,
                            )}
                            {item.type !== "assessment"
                              ? ` (${item.count} ${
                                  item.count === 1 ? "location" : "locations"
                                })`
                              : ""}
                            : {formatDisplayDate(item.oldDate)} →{" "}
                            {formatDisplayDate(item.newDate)}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {result.statusChangedToC.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <h4 className="text-md font-medium text-amber-800 mb-3">
                Patients with status changed to &quot;Consecutive no-shows&quot;
              </h4>
              <ul className="space-y-2">
                {result.statusChangedToC.map((item) => (
                  <li key={item.patientId} className="text-sm text-amber-700">
                    • {item.patientName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {groupedCancelled.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-md font-medium text-red-800 mb-3">
                Appointments canceled due to consecutive no-shows
              </h4>
              <ul className="space-y-3">
                {groupedCancelled.map((item) => (
                  <li key={item.patientId} className="text-sm text-red-700">
                    <div className="font-medium">• {item.patientName}</div>
                    {item.appointments.length > 0 && (
                      <ul className="ml-4 mt-1 space-y-1 text-xs">
                        {item.appointments.map((att) => (
                          <li key={`${att.type}|${att.scheduledDate}`}>
                            {getAppointmentTypeLabel(att.type as AppointmentType)}
                            {att.type !== "assessment" && att.count > 1
                              ? ` (${att.count} locations)`
                              : ""}{" "}
                            - {formatDisplayDate(att.scheduledDate)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {groupedNotRescheduled.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="text-md font-medium text-yellow-800 mb-3">
                Could not reschedule
              </h4>
              <ul className="space-y-4">
                {groupedNotRescheduled.map(
                  ({ patientId, patientName, appointments }) => (
                    <li key={patientId} className="text-sm text-yellow-700">
                      <div className="font-medium">• {patientName}</div>
                      <ul className="ml-4 mt-1 space-y-1">
                        {appointments.map((item) => (
                          <li
                            key={`${item.type}|${item.reason}`}
                            className="text-xs text-yellow-700"
                          >
                            {getAppointmentTypeLabel(
                              item.type as AppointmentType,
                            )}
                            {item.type !== "assessment" && item.count > 1
                              ? ` (${item.count} locations)`
                              : ""}
                            : {item.reason}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" onClick={onConclude}>
          Complete
        </Button>
      </div>
    </div>
  );
};

export default SummaryStep;
