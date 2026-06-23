import type {
  AppointmentStatusDetail,
  AppointmentType,
  AppointmentProgression,
} from "@/types/types";
import type { AppointmentByDate } from "@/types/types";

/** Ordered list of appointment progression statuses (section order in the UI). */
export const APPOINTMENT_BOARD_STATUSES: AppointmentProgression[] = [
  "scheduled",
  "checkedIn",
  "onGoing",
  "completed",
];

/** Collapsed state with all sections collapsed. Used when day has no slots or is holiday. */
export const ALL_SECTIONS_COLLAPSED: Record<AppointmentType, boolean> = {
  assessment: true,
  physiotherapy: true,
  tens: true,
  combined: true,
};

// Enhanced interface to include appointment type
export interface IAppointmentStatusDetailWithType extends AppointmentStatusDetail {
  appointmentType: AppointmentType;
}

// Grouped appointment for display purposes
export interface GroupedAppointmentDisplay {
  patientName: string;
  patientId?: number;
  label: string;
}

export const getIncompleteAppointments = (appointmentsByDate: AppointmentByDate | null): IAppointmentStatusDetailWithType[] => {
  if (!appointmentsByDate) return [];

  const incomplete: IAppointmentStatusDetailWithType[] = [];
  // Collect all incomplete appointments from all types and statuses
  (["assessment", "physiotherapy", "tens"] as AppointmentType[]).forEach((type) => {
    ["checkedIn", "onGoing"].forEach((status) => {
      const typeData = appointmentsByDate[type];
      if (typeData && typeof typeData === "object") {
        const statusData = typeData[status as keyof typeof typeData];
        if (Array.isArray(statusData)) {
          const appointmentsWithType = (statusData as AppointmentStatusDetail[])
            .filter(appointment => !appointment.isCancelled && !appointment.isMissed)
            .map(appointment => ({
              ...appointment,
              appointmentType: type
            }));
          incomplete.push(...appointmentsWithType);
        }
      }
    });
  });

  return incomplete;
};

export const getCompletedAppointments = (appointmentsByDate: AppointmentByDate | null): IAppointmentStatusDetailWithType[] => {
  if (!appointmentsByDate) return [];

  const completed: IAppointmentStatusDetailWithType[] = [];
  // Collect all completed appointments from all types
  (["assessment", "physiotherapy", "tens"] as AppointmentType[]).forEach((type) => {
    const typeData = appointmentsByDate[type];
    if (typeData && typeof typeData === "object" && "completed" in typeData) {
      const completedData = typeData.completed;
      if (Array.isArray(completedData)) {
        const appointmentsWithType = (completedData as AppointmentStatusDetail[])
          .filter(appointment => !appointment.isCancelled && !appointment.isMissed)
          .map(appointment => ({
            ...appointment,
            appointmentType: type
          }));
        completed.push(...appointmentsWithType);
      }
    }
  });

  return completed;
};

export const getScheduledAbsences = (appointmentsByDate: AppointmentByDate | null): IAppointmentStatusDetailWithType[] => {
  if (!appointmentsByDate) return [];

  const scheduled: IAppointmentStatusDetailWithType[] = [];
  // Collect all scheduled appointments from all types
  (["assessment", "physiotherapy", "tens"] as AppointmentType[]).forEach((type) => {
    const typeData = appointmentsByDate[type];
    if (typeData && typeof typeData === "object" && "scheduled" in typeData) {
      const scheduledData = typeData.scheduled;
      if (Array.isArray(scheduledData)) {
        const appointmentsWithType = (scheduledData as AppointmentStatusDetail[])
          .filter(appointment => !appointment.isCancelled && !appointment.isMissed)
          .map(appointment => ({
            ...appointment,
            appointmentType: type
          }));
        scheduled.push(...appointmentsWithType);
      }
    }
  });

  return scheduled;
};

/** Statuses counted for "has appointments on date" (scheduled, onGoing, completed). */
const STATUSES_FOR_HAS_APPOINTMENTS: Array<
  "scheduled" | "onGoing" | "completed"
> = ["scheduled", "onGoing", "completed"];

/**
 * Returns whether there is any appointment on the date (scheduled, onGoing, or completed).
 * Used to avoid applying no-slots/holiday restrictions when the day already has data.
 */
export const hasAppointmentsOnDate = (
  appointmentsByDate: AppointmentByDate | null,
): boolean => {
  if (!appointmentsByDate) return false;
  let total = 0;
  for (const type of ["assessment", "physiotherapy", "tens"] as const) {
    const data = appointmentsByDate[type];
    if (data && typeof data === "object")
      for (const s of STATUSES_FOR_HAS_APPOINTMENTS)
        total += Array.isArray(data[s]) ? data[s].length : 0;
  }
  return total > 0;
};

/**
 * Returns default collapsed state for each appointment section based on whether
 * there is appointment data and whether the day has slots. Sections with no
 * appointments and no slots start collapsed.
 */
export const getDefaultCollapsedForDate = (
  appointmentsByDate: AppointmentByDate | null,
  hasSlotsForDay: boolean,
): Record<AppointmentType, boolean> => {
  if (!appointmentsByDate) {
    return ALL_SECTIONS_COLLAPSED;
  }
  const assessment = appointmentsByDate.assessment;
  const physiotherapy = appointmentsByDate.physiotherapy;
  const tens = appointmentsByDate.tens;
  const hasExpectedShape =
    assessment &&
    physiotherapy &&
    tens &&
    APPOINTMENT_BOARD_STATUSES.every(
      (s) =>
        Array.isArray(assessment[s]) &&
        Array.isArray(physiotherapy[s]) &&
        Array.isArray(tens[s]),
    );
  if (!hasExpectedShape) {
    return {
      assessment: !hasSlotsForDay,
      physiotherapy: !hasSlotsForDay,
      tens: !hasSlotsForDay,
      combined: !hasSlotsForDay,
    };
  }
  const assessmentHasAppointment = APPOINTMENT_BOARD_STATUSES.some(
    (s) => assessment[s].length > 0,
  );
  const mixedHasAppointment = APPOINTMENT_BOARD_STATUSES.some(
    (s) => physiotherapy[s].length > 0 || tens[s].length > 0,
  );
  return {
    assessment: !assessmentHasAppointment && !hasSlotsForDay,
    physiotherapy: !mixedHasAppointment && !hasSlotsForDay,
    tens: !mixedHasAppointment && !hasSlotsForDay,
    combined: !mixedHasAppointment && !hasSlotsForDay,
  };
};
