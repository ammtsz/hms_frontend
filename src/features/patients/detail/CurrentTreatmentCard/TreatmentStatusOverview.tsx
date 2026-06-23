import React, { useCallback } from "react";
import Link from "next/link";
import { Patient } from "@/types/types";
import { formatDisplayDate, getDaysOverdue } from "@/utils/dateUtils";
import {
  PATIENT_PAGE_SECTION_IDS,
  SCROLL_AFTER_EXPAND_DELAY_MS,
  usePatientPageScrollTarget,
} from "@/features/patients/detail/PatientPageSectionNav";
const OVERVIEW_CARD_CLASS =
  "block w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

interface TreatmentStatusOverviewProps {
  patient: Patient;
}

export const TreatmentStatusOverview: React.FC<
  TreatmentStatusOverviewProps
> = ({ patient }) => {
  const { setScrollTargetSectionId } = usePatientPageScrollTarget();
  const isExpectedDischarge = patient.status !== "D";
  const daysOverdue = patient.dischargeDate
    ? getDaysOverdue(patient.dischargeDate)
    : 0;
  const isOverdue = isExpectedDischarge && daysOverdue > 0;

  const scrollToScheduledAppointments = useCallback(() => {
    setScrollTargetSectionId(PATIENT_PAGE_SECTION_IDS.scheduledAppointments);
    setTimeout(() => {
      const element = document.getElementById(
        PATIENT_PAGE_SECTION_IDS.scheduledAppointments,
      );
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, SCROLL_AFTER_EXPAND_DELAY_MS);
  }, [setScrollTargetSectionId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white border border-gray-200 p-4 rounded-lg">
        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
          Registration Date
        </div>
        <div className="text-lg font-semibold text-gray-900">
          {formatDisplayDate(patient.startDate)}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToScheduledAppointments}
        className={OVERVIEW_CARD_CLASS}
      >
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
          Next Appointment
        </div>
        <div className="text-lg font-semibold text-gray-900 break-words">
          {patient.nextAppointmentDates[0]?.date ? (
            formatDisplayDate(patient.nextAppointmentDates[0].date)
          ) : (
            <span className="font-medium text-gray-500">Not scheduled</span>
          )}
        </div>
        <div className="mt-2 text-xs text-blue-600">
          View all appointments →
        </div>
      </button>

      {patient.status === "D" ? (
        <div className="bg-white border border-gray-200 p-4 rounded-lg block w-full text-left">
          <div className="flex items-center gap-1 text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Discharged on
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {patient.dischargeDate ? (
              formatDisplayDate(patient.dischargeDate)
            ) : (
              <span className="text-gray-500 font-medium">Not set</span>
            )}
          </div>
        </div>
      ) : (
        <Link
          href={`/patients/${patient.id}/edit?focus=dischargeDate`}
          className={OVERVIEW_CARD_CLASS}
        >
          <div className="flex items-center gap-1 text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Expected Discharge
            {isOverdue && (
              <span className="">
                ({daysOverdue === 1 ? "1 day" : `${daysOverdue} days`} overdue)
              </span>
            )}
          </div>
          <div
            className={`text-lg font-semibold ${
              isOverdue ? "text-red-600" : "text-gray-900"
            }`}
          >
            {patient.dischargeDate ? (
              formatDisplayDate(patient.dischargeDate)
            ) : (
              <span className="text-gray-500 font-medium">Not set</span>
            )}
          </div>
          <div className="text-xs text-blue-600 mt-2">Update date →</div>
        </Link>
      )}
    </div>
  );
};
