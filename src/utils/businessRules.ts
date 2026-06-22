// Business logic for scheduling, priorities, and status

import { AttendanceStatusDetail, AttendanceByDate } from "@/types/types";

/**
 * Priority Queue Rules for Checked-In Patients
 * 
 * Priority levels:
 * - Priority "1": Highest priority (urgent cases) - displayed first
 * - Priority "2": Medium priority (standard cases) - displayed second  
 * - Priority "3": Lowest priority (routine cases) - displayed last
 * 
 * Sorting criteria (in order of importance):
 * 1. Priority level: Lower number = higher priority (1 > 2 > 3)
 * 2. Check-in time: When priorities are equal, earlier check-in time takes precedence
 * 
 * Example sorting order:
 * - Patient A: Priority 1, checked in 09:00 (1st)
 * - Patient B: Priority 1, checked in 09:30 (2nd) 
 * - Patient C: Priority 2, checked in 08:45 (3rd)
 * - Patient D: Priority 2, checked in 09:15 (4th)
 * 
 * - Patients in "checkedIn" status are automatically sorted by these criteria
 * - First patient in the sorted list is marked as "next to be attended"
 * - Drag-and-drop operations maintain priority+time sorting when patients move to checkedIn
 */

/**
 * Sorts patients by priority first, then by check-in time
 * @param patients Array of patients with priority and checkedInTime properties
 * @returns Sorted array (1 = highest priority, earlier time = higher precedence)
 */
export const sortPatientsByPriority = <T extends {
  priority: string;
  checkedInTime?: string | null;
}>(patients: T[]): T[] => {
  return [...patients].sort((a, b) => {
    // Primary sort: by priority (1 > 2 > 3)
    const priorityA = parseInt(a.priority);
    const priorityB = parseInt(b.priority);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Secondary sort: by check-in time (earlier = higher precedence)
    const timeA = a.checkedInTime ? new Date(a.checkedInTime).getTime() : 0;
    const timeB = b.checkedInTime ? new Date(b.checkedInTime).getTime() : 0;
    
    // If both have check-in times, sort by time (earlier first)
    if (timeA && timeB) {
      return timeA - timeB;
    }
    
    // If only one has check-in time, prioritize the one with time
    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;
    
    // If neither has check-in time, maintain original order
    return 0;
  });
};

/**
 * BR-306: blocks only when scheduling a second open assessment the same day.
 * Physiotherapy / tens allow multiple same-day entries (location/color enforced on backend).
 */
export const isPatientAlreadyScheduledForAssessment = (
  patientName: string,
  attendancesByDate: AttendanceByDate | null,
): boolean => {
  if (!attendancesByDate?.assessment) return false;

  const normalizedName = patientName.toLowerCase();
  const allStatuses = ["scheduled", "checkedIn", "onGoing", "completed"] as const;

  for (const status of allStatuses) {
    const statusAttendances = attendancesByDate.assessment[status];
    if (
      statusAttendances?.some(
        (attendance: AttendanceStatusDetail) =>
          attendance.name.toLowerCase() === normalizedName,
      )
    ) {
      return true;
    }
  }

  return false;
};

// Future: Implement additional rules for schedule, absences, and scheduling conflicts as needed
