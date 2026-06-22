import React from "react";
import Link from "next/link";
import { formatDisplayDate } from "@/utils/dateUtils";
import { Button } from "@/components/ui";

// Base Empty State Component
interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  iconBgColor?: string;
  children?: React.ReactNode; // For custom action buttons or additional content
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  iconBgColor = "bg-gray-50",
  children,
}) => (
  <div className="text-center py-8">
    {icon && (
      <div
        className={`${iconBgColor} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}
      >
        <div className="text-2xl">{icon}</div>
      </div>
    )}
    <div className="font-medium text-gray-900 mb-2">{title}</div>
    <div className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
      {description}
    </div>
    {children}
  </div>
);

// Error State Component
interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  retryLabel = "Try again",
}) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="text-red-500 mr-3">⚠️</div>
        <div>
          <p className="text-red-800 font-medium">{title}</p>
          <p className="text-red-700 text-sm">{message}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50 hover:text-red-800"
      >
        {retryLabel}
      </Button>
    </div>
  </div>
);

// Specialized Empty States for specific cards

// Attendance History Empty State
interface AttendanceHistoryEmptyProps {
  patient: { nextAttendanceDates: Array<{ date: string }> };
  statusFilter?: "all" | "completed" | "missed" | "cancelled";
}

export const AttendanceHistoryEmpty: React.FC<AttendanceHistoryEmptyProps> = ({
  patient,
  statusFilter = "all",
}) => {
  // Define messages based on filter
  const getEmptyStateContent = () => {
    switch (statusFilter) {
      case "completed":
        return {
          title: "No completed attendances",
          description:
            "This patient has no completed attendances yet. The history will appear here after attendances are finished.",
          iconBgColor: "bg-green-50",
        };
      case "missed":
        return {
          title: "No absences recorded",
          description:
            "This patient has no recorded absences. Missed attendances will appear here when the patient does not show up.",
          iconBgColor: "bg-yellow-50",
        };
      case "cancelled":
        return {
          title: "No cancelled attendances",
          description:
            "This patient has no cancelled attendances. Cancellations will appear here when the patient cancels an appointment.",
          iconBgColor: "bg-red-50",
        };
      default:
        return {
          title: "No attendances recorded",
          description:
            "This is a new patient or no attendances have been recorded yet. History will appear here after attendances are completed.",
          iconBgColor: "bg-green-50",
        };
    }
  };

  const { title, description, iconBgColor } = getEmptyStateContent();

  return (
    <EmptyState
      title={title}
      description={description}
      iconBgColor={iconBgColor}
    >
      {statusFilter === "all" || statusFilter === "completed" ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="text-sm">
            <div className="font-medium text-blue-900 mb-1">💡 Next steps:</div>
            <div className="text-blue-800">
              {patient.nextAttendanceDates.length > 0
                ? `Next appointment scheduled for ${formatDisplayDate(
                    patient.nextAttendanceDates[0].date,
                  )}`
                : "Schedule the first appointment to start treatment"}
            </div>
          </div>
        </div>
      ) : null}
    </EmptyState>
  );
};

// Scheduled Attendances Empty State
interface ScheduledAttendancesEmptyProps {
  patientId: string;
}

export const ScheduledAttendancesEmpty: React.FC<
  ScheduledAttendancesEmptyProps
> = ({ patientId }) => (
  <EmptyState
    // icon="📅"
    title="No upcoming appointments"
    description="This patient currently has no upcoming appointments. New Attendances will appear here when created."
    iconBgColor="bg-blue-50"
  >
    <div className="flex flex-col sm:flex-row gap-2 justify-center">
      <Link
        href={`/agenda?patient=${patientId}&action=schedule`}
        className="inline-flex items-center justify-center px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 rounded-md text-sm font-semibold transition-colors min-h-[44px] flex-1 sm:flex-none text-center"
      >
        📅 Schedule Appointment
      </Link>
      <Link
        href="/agenda"
        className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-semibold transition-colors min-h-[44px] flex-1 sm:flex-none text-center"
      >
        View Schedule
      </Link>
    </div>
  </EmptyState>
);

// Treatment Recommendations Empty State
export const TreatmentRecommendationsEmpty: React.FC = () => (
  <EmptyState
    title="Recommendations unavailable"
    description="This patient does not yet have any treatment recommendations recorded."
    iconBgColor="bg-yellow-50"
  />
);

// Current Treatment Empty State (when no active treatments)
export const CurrentTreatmentEmpty: React.FC = () => (
  <EmptyState
    icon="🗂️"
    title="No active treatment"
    description="This patient currently has no ongoing treatments. Active treatments will appear here when started."
    iconBgColor="bg-blue-50"
  />
);
