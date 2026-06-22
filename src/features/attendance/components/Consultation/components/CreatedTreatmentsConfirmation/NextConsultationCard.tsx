import React from "react";
import { formatDisplayDate, getWeeksUntil } from "@/utils/dateUtils";
import type { AttendanceResponseDto } from "@/api/types";

interface NextConsultationCardProps {
  nextAssessmentConsultation: AttendanceResponseDto | null;
  fetchingAttendances?: boolean;
  attendancesError?: string;
  createdDate?: string;
  returnWeeks?: number;
  returnWhenTreatmentComplete?: boolean;
}

/**
 * NextConsultationCard - Displays next assessment consultation or loading/error states
 */
export const NextConsultationCard: React.FC<NextConsultationCardProps> = ({
  nextAssessmentConsultation,
  fetchingAttendances,
  attendancesError,
  createdDate,
  returnWeeks,
  returnWhenTreatmentComplete,
}) => {
  if (fetchingAttendances) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-blue-900 mb-1">
              Searching for created appointments...
            </h4>
            <p className="text-sm text-blue-700">
              Verifying the next scheduled appointments automatically
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (attendancesError) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-5 mb-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-amber-900 mb-1">
              Error fetching appointments
            </h4>
            <p className="text-sm text-amber-700 mb-2">
              {attendancesError || "Error fetching created appointments"}
            </p>
            <p className="text-xs text-amber-600">
              The appointments were created successfully, but we couldn&apos;t
              display them at the moment. You can see all appointments in the
              patient&apos;s schedule.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!nextAssessmentConsultation) {
    return null;
  }

  const weeksUntil = getWeeksUntil(
    nextAssessmentConsultation.scheduledDate,
    createdDate,
  );

  return (
    <div className="border-l-4 border-purple-500 rounded-lg p-5 mb-2">
      <div className="flex flex-col items-start gap-2">
        {/* Icon and title */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div>
              <h4 className="text-lg font-semibold mb-1">
                Return of Assessment Consultation
              </h4>
            </div>
          </div>
        </div>

        {/* Scheduled date and time */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📅</span>
            <div>
              <div className="text-sm text-gray-600">Date</div>
              <div className="text-lg font-bold text-gray-800">
                {formatDisplayDate(nextAssessmentConsultation.scheduledDate)}
              </div>
            </div>
          </div>
          {weeksUntil > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Return in</div>
              <div className="text-md font-semibold text-gray-800">
                {weeksUntil} {weeksUntil === 1 ? "week" : "weeks"}
              </div>
              {returnWhenTreatmentComplete &&
                returnWeeks !== undefined &&
                returnWeeks >= 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    (
                    {returnWeeks === 0
                      ? "on the day of the treatment's last session"
                      : `${returnWeeks} ${returnWeeks === 1 ? "week" : "weeks"} after treatment ends`}
                    )
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
