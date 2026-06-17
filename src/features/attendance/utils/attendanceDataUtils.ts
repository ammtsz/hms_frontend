import type {
  AttendanceStatusDetail,
  AttendanceType,
  AttendanceProgression,
} from "@/types/types";
import type { AttendanceByDate } from "@/types/types";

/** Ordered list of attendance progression statuses (section order in the UI). */
export const ATTENDANCE_STATUSES: AttendanceProgression[] = [
  "scheduled",
  "checkedIn",
  "onGoing",
  "completed",
];

/** Collapsed state with all sections collapsed. Used when day has no slots or is holiday. */
export const ALL_SECTIONS_COLLAPSED: Record<AttendanceType, boolean> = {
  assessment: true,
  physiotherapy: true,
  tens: true,
  combined: true,
};

// Enhanced interface to include attendance type
export interface IAttendanceStatusDetailWithType extends AttendanceStatusDetail {
  attendanceType: AttendanceType;
}

// Grouped attendance for display purposes
export interface GroupedAttendanceDisplay {
  patientName: string;
  patientId?: number;
  label: string;
}

export const getIncompleteAttendances = (attendancesByDate: AttendanceByDate | null): IAttendanceStatusDetailWithType[] => {
  if (!attendancesByDate) return [];

  const incomplete: IAttendanceStatusDetailWithType[] = [];
  // Collect all incomplete attendances from all types and statuses
  (["assessment", "physiotherapy", "tens"] as AttendanceType[]).forEach((type) => {
    ["checkedIn", "onGoing"].forEach((status) => {
      const typeData = attendancesByDate[type];
      if (typeData && typeof typeData === "object") {
        const statusData = typeData[status as keyof typeof typeData];
        if (Array.isArray(statusData)) {
          const attendancesWithType = (statusData as AttendanceStatusDetail[])
            .filter(attendance => !attendance.isCancelled && !attendance.isMissed)
            .map(attendance => ({
              ...attendance,
              attendanceType: type
            }));
          incomplete.push(...attendancesWithType);
        }
      }
    });
  });

  return incomplete;
};

export const getCompletedAttendances = (attendancesByDate: AttendanceByDate | null): IAttendanceStatusDetailWithType[] => {
  if (!attendancesByDate) return [];

  const completed: IAttendanceStatusDetailWithType[] = [];
  // Collect all completed attendances from all types
  (["assessment", "physiotherapy", "tens"] as AttendanceType[]).forEach((type) => {
    const typeData = attendancesByDate[type];
    if (typeData && typeof typeData === "object" && "completed" in typeData) {
      const completedData = typeData.completed;
      if (Array.isArray(completedData)) {
        const attendancesWithType = (completedData as AttendanceStatusDetail[])
          .filter(attendance => !attendance.isCancelled && !attendance.isMissed)
          .map(attendance => ({
            ...attendance,
            attendanceType: type
          }));
        completed.push(...attendancesWithType);
      }
    }
  });

  return completed;
};

export const getScheduledAbsences = (attendancesByDate: AttendanceByDate | null): IAttendanceStatusDetailWithType[] => {
  if (!attendancesByDate) return [];

  const scheduled: IAttendanceStatusDetailWithType[] = [];
  // Collect all scheduled attendances from all types
  (["assessment", "physiotherapy", "tens"] as AttendanceType[]).forEach((type) => {
    const typeData = attendancesByDate[type];
    if (typeData && typeof typeData === "object" && "scheduled" in typeData) {
      const scheduledData = typeData.scheduled;
      if (Array.isArray(scheduledData)) {
        const attendancesWithType = (scheduledData as AttendanceStatusDetail[])
          .filter(attendance => !attendance.isCancelled && !attendance.isMissed)
          .map(attendance => ({
            ...attendance,
            attendanceType: type
          }));
        scheduled.push(...attendancesWithType);
      }
    }
  });

  return scheduled;
};

/** Statuses counted for "has attendances on date" (scheduled, onGoing, completed). */
const STATUSES_FOR_HAS_ATTENDANCES: Array<
  "scheduled" | "onGoing" | "completed"
> = ["scheduled", "onGoing", "completed"];

/**
 * Returns whether there is any attendance on the date (scheduled, onGoing, or completed).
 * Used to avoid applying no-slots/holiday restrictions when the day already has data.
 */
export const hasAttendancesOnDate = (
  attendancesByDate: AttendanceByDate | null,
): boolean => {
  if (!attendancesByDate) return false;
  let total = 0;
  for (const type of ["assessment", "physiotherapy", "tens"] as const) {
    const data = attendancesByDate[type];
    if (data && typeof data === "object")
      for (const s of STATUSES_FOR_HAS_ATTENDANCES)
        total += Array.isArray(data[s]) ? data[s].length : 0;
  }
  return total > 0;
};

/**
 * Returns default collapsed state for each attendance section based on whether
 * there is attendance data and whether the day has slots. Sections with no
 * attendances and no slots start collapsed.
 */
export const getDefaultCollapsedForDate = (
  attendancesByDate: AttendanceByDate | null,
  hasSlotsForDay: boolean,
): Record<AttendanceType, boolean> => {
  if (!attendancesByDate) {
    return ALL_SECTIONS_COLLAPSED;
  }
  const assessment = attendancesByDate.assessment;
  const physiotherapy = attendancesByDate.physiotherapy;
  const tens = attendancesByDate.tens;
  const hasExpectedShape =
    assessment &&
    physiotherapy &&
    tens &&
    ATTENDANCE_STATUSES.every(
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
  const assessmentHasAttendance = ATTENDANCE_STATUSES.some(
    (s) => assessment[s].length > 0,
  );
  const mixedHasAttendance = ATTENDANCE_STATUSES.some(
    (s) => physiotherapy[s].length > 0 || tens[s].length > 0,
  );
  return {
    assessment: !assessmentHasAttendance && !hasSlotsForDay,
    physiotherapy: !mixedHasAttendance && !hasSlotsForDay,
    tens: !mixedHasAttendance && !hasSlotsForDay,
    combined: !mixedHasAttendance && !hasSlotsForDay,
  };
};
