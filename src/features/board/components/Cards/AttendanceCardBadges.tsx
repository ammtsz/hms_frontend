import React from "react";
import type { IGroupedPatient } from "../../utils/patientGrouping";
import { countTreatmentTypes } from "../../utils/patientGrouping";
import { ATTENDANCE_CARD_OVERLAY_LABELS } from "../../styles/cardStyles";

interface AttendanceCardBadgesProps {
  isMissed: boolean;
  isCancelled: boolean;
  isNextToBeAttended: boolean;
  groupedPatient?: IGroupedPatient;
}

const AttendanceCardBadges: React.FC<AttendanceCardBadgesProps> = ({
  isMissed,
  isCancelled,
  isNextToBeAttended,
  groupedPatient,
}) => {
  const isMissedOrCancelled = isMissed || isCancelled;

  const typeCounts = groupedPatient
    ? countTreatmentTypes(groupedPatient.treatmentTypes)
    : { physiotherapy: 0, tens: 0 };

  return (
    <>
      {/* Missed/Cancelled indicator */}
      {isMissed && (
        <span className="absolute top-1 right-1 text-red-700 text-xs px-2 py-1 rounded z-10 bg-red-100 font-semibold">
          {ATTENDANCE_CARD_OVERLAY_LABELS.missed}
        </span>
      )}
      {isCancelled && (
        <span className="absolute top-1 right-1 text-gray-700 text-xs px-2 py-1 rounded z-10 bg-gray-300 font-semibold">
          {ATTENDANCE_CARD_OVERLAY_LABELS.cancelled}
        </span>
      )}

      {/* Next to be attended indicator (only show if not missed/cancelled) */}
      {isNextToBeAttended && !isMissedOrCancelled && (
        <span className="absolute top-1 right-1 text-red-700 text-xs px-1 py-0.5 rounded z-10">
          {ATTENDANCE_CARD_OVERLAY_LABELS.next}
        </span>
      )}

      {/* Treatment type attendances count (attendances on this card only) */}
      {groupedPatient &&
        (typeCounts.physiotherapy > 0 || typeCounts.tens > 0) && (
          <div className="absolute top-1 left-1 text-xs px-1 flex gap-1">
            {typeCounts.physiotherapy > 0 && (
              <span className="flex items-center justify-center gap-1 h-5 w-5 bg-yellow-200 text-yellow-800 rounded-4xl ">
                {typeCounts.physiotherapy}
              </span>
            )}
            {typeCounts.tens > 0 && (
              <span className="flex items-center justify-center gap-1 h-5 w-5 bg-blue-200 text-blue-800 rounded-4xl ">
                {typeCounts.tens}
              </span>
            )}
          </div>
        )}
    </>
  );
};

AttendanceCardBadges.displayName = "AttendanceCardBadges";

export default AttendanceCardBadges;
