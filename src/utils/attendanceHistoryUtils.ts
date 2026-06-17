import type {
  TreatmentResponseDto,
  ConsultationResponseDto,
  SessionResponseDto,
} from "@/api/types";
import type { PreviousAttendance, AttendanceType } from "@/types/types";
import { formatDateClinic, getTodayClinic } from "@/utils/timezoneDate";

// Grouped attendance by date and treatment type
export interface GroupedAttendance {
  date: string; // YYYY-MM-DD format
  attendanceId: string; // Primary (first) attendance id for backward compatibility
  /** All attendance IDs in this group (same date); use for reschedule (send all). */
  attendanceIds: string[];
  notes: string;
  status?: 'completed' | 'missed' | 'cancelled'; // Attendance status
  absenceNotes?: string; // Absence justification
  absenceJustified?: boolean; // Whether absence was justified
  createdDate: string; // YY-MM-DD
  updatedDate: string; // YY-MM-DD
  cancelledDate?: string; // YYYY-MM-DD (only for cancelled attendances)
  treatments: {
    assessment?: {
      notes?: string; // Attendance notes
      /** Notes from the assessment consultation (`hms_consultation`). */
      consultationNotes?: string;
      consultationId?: number;
      recommendations?: {
        food?: string;
        water?: string;
        ointment?: string;
        physiotherapy?: boolean;
        tens?: boolean;
        returnWeeks?: number;
        returnWhenTreatmentComplete?: boolean;
      };
    };
    physiotherapy?: {
      /** Per body location (same order as first seen when merging sessions). */
      bodyLocationsWithColors: Array<{ bodyLocation: string; color?: string }>;
      color?: string;
      duration?: number;
      /** Display fraction completed/total (e.g. `"2/5"`). */
      sessionNumber: string;
      notes?: string; // Treatment notes
      attendanceNotes?: string; // Notes from the attendance
      /** Per-visit rows for this day (from `TreatmentResponseDto.sessions`). */
      sessions?: SessionResponseDto[];
    };
    tens?: {
      bodyLocations: string[];
      sessionNumber: string; // Format: "2/5" (completed/total)
      notes?: string; // Treatment notes
      attendanceNotes?: string; // Notes from the attendance
      sessions?: SessionResponseDto[];
    };
  };
}

/** Build map key from date and status so same-day attendances with different statuses stay separate */
const dateStatusKey = (date: string, status?: string): string =>
  `${date}-${status ?? "completed"}`;

/** Combine notes from different attendances on the same date */
const combineNotes = (existingNotes: string | undefined, newNotes: string | undefined) => {
  if(existingNotes && newNotes) {
    return existingNotes.includes(newNotes) ? existingNotes : `${existingNotes}\n${newNotes}`;
  } else if(existingNotes) {
    return existingNotes;
  } else if(newNotes) {
    return newNotes;
  }
  return undefined;
}

const buildPhysiotherapyLocationFieldsFromMap = (
  bodyLocationColors: Map<string, string | undefined>
): {
  bodyLocationsWithColors: Array<{ bodyLocation: string; color?: string }>;
  color?: string;
} => {
  const bodyLocationsWithColors = Array.from(bodyLocationColors.entries()).map(
    ([bodyLocation, c]) => ({
      bodyLocation,
      ...(c !== undefined && c !== "" ? { color: c } : {}),
    })
  );
  const distinctColors: string[] = [];
  for (const e of bodyLocationsWithColors) {
    const t = e.color?.trim();
    if (t && !distinctColors.includes(t)) distinctColors.push(t);
  }
  return {
    bodyLocationsWithColors,
    color: distinctColors.length === 1 ? distinctColors[0] : undefined,
  };
};

/** Format notes to be displayed in the UI. Deduplicates lines and numbers multi-line notes. */
export const formatNotes = (notes: string) => {
  if (notes.includes("\n")) {
    const lines = notes.split("\n").map((line) => line.trim()).filter(Boolean);
    const unique: string[] = [];
    for (const line of lines) {
      if (!unique.includes(line)) unique.push(line);
    }
    const formattedNotes = unique.map((line, index) => `${index + 1}. ${line}`).join("\n");
    return `\n${formattedNotes};`
  }
  return notes;
};
/**
 * Create base attendance entries from attendance data.
 * Groups by date + status so e.g. same-day "completed" assessment and "cancelled" physiotherapy appear as separate items.
 */
const createBaseAttendances = (
  attendances: PreviousAttendance[]
): Map<string, GroupedAttendance> => {
  const attendanceMap = new Map<string, GroupedAttendance>();

  attendances.forEach((attendance) => {
    const key = dateStatusKey(attendance.date, attendance.status);

    if (!attendanceMap.has(key)) {
      attendanceMap.set(key, {
        date: attendance.date,
        attendanceId: attendance.attendanceId,
        attendanceIds: [attendance.attendanceId],
        notes: attendance.notes,
        status: attendance.status,
        absenceNotes: attendance.absenceNotes,
        absenceJustified: attendance.absenceJustified,
        createdDate: attendance.createdDate,
        updatedDate: attendance.updatedDate,
        cancelledDate: attendance.cancelledDate,
        treatments: {},
      });
    } else {
      const grouped = attendanceMap.get(key)!;
      if (!grouped.attendanceIds.includes(attendance.attendanceId)) {
        grouped.attendanceIds.push(attendance.attendanceId);
      }
    }
  });

  return attendanceMap;
};

/**
 * Attach consultation snapshot (recommendations, notes) to grouped assessment attendances.
 */
const mergeConsultationIntoGroupedAttendances = (
  attendanceMap: Map<string, GroupedAttendance>,
  attendances: PreviousAttendance[],
  consultations: ConsultationResponseDto[]
): void => {
  attendances.forEach((attendance) => {
    if (attendance.type !== "assessment") return;

    const key = dateStatusKey(attendance.date, attendance.status);
    const grouped = attendanceMap.get(key);
    if (!grouped) return;

    const consultation = consultations.find(
      (c) => c.attendanceId === Number(attendance.attendanceId),
    );

    grouped.treatments.assessment = {
      notes: attendance.notes,
      consultationNotes: consultation?.notes,
      consultationId: consultation?.id,
      recommendations: consultation
        ? {
            food: consultation.food || "",
            water: consultation.water || "",
            ointment: consultation.ointments || "",
            physiotherapy: consultation.physiotherapy || false,
            tens: consultation.tens || false,
            returnWeeks: consultation.returnWeeks || 0,
            returnWhenTreatmentComplete: consultation.returnWhenTreatmentComplete || false,
          }
        : attendance.recommendations || undefined,
    };
  });
};

/**
 * Type definition for treatment data grouped by date
 */
interface TreatmentDataByDate {
  physiotherapy?: {
    /** Body location → color for that session row (last write wins if duplicated). */
    bodyLocationColors: Map<string, string | undefined>;
    sessionNumber: number; // Single session number for this date
    duration?: number;
    plannedSessions: number;
    attendanceId: number;
    notes: string;
    attendanceNotes?: string; // Notes from the attendance
    absenceNotes?: string; // Absence justification
    sessions: SessionResponseDto[];
    status?: 'completed' | 'missed' | 'cancelled';
  };
  tens?: {
    bodyLocations: Set<string>;
    sessionNumber: number; // Single session number for this date
    plannedSessions: number;
    attendanceId: number;
    notes: string;
    attendanceNotes?: string; // Notes from the attendance
    absenceNotes?: string; // Absence justification
    sessions: SessionResponseDto[];
    status?: 'completed' | 'missed' | 'cancelled';
  };
}

/**
 * Group treatments (with session rows) by date + status so they merge into the correct attendance group.
 */
const groupTreatmentsByDateForHistory = (
  treatments: TreatmentResponseDto[],
  attendances: PreviousAttendance[]
): Map<string, TreatmentDataByDate> => {
  const treatmentDataByDate = new Map<string, TreatmentDataByDate>();
  const clinicToday = getTodayClinic();

  treatments.forEach((treatment) => {
    const treatmentStatus = treatment.status as 'completed' | 'missed' | 'cancelled';

    treatment.sessions?.forEach((sessionRow) => {
      const sessionRowStatus = sessionRow.status;
      const sessionDate = formatDateClinic(sessionRow.scheduledDate);

      if (sessionDate <= clinicToday) {
        const dateKey = dateStatusKey(sessionDate, sessionRowStatus);

        if (!treatmentDataByDate.has(dateKey)) {
          treatmentDataByDate.set(dateKey, {});
        }

        const dateData = treatmentDataByDate.get(dateKey)!;

        if (treatment.treatmentType === "physiotherapy") {
          if (!dateData.physiotherapy) {
            // Find matching attendance notes
            const matchingAttendance = attendances.find(
              (a) => a.date === sessionDate && a.type === "physiotherapy"
            );
            dateData.physiotherapy = {
              bodyLocationColors: new Map(),
              sessionNumber: sessionRow.sessionNumber, // All treatments on same date have same session number
              duration: treatment.durationMinutes,
              plannedSessions: treatment.plannedSessions,
              attendanceId: treatment.attendanceId,
              notes: treatment.notes || "",
              attendanceNotes: matchingAttendance?.notes,
              absenceNotes: matchingAttendance?.absenceNotes,
              sessions: treatment.sessions || [],
              status: treatmentStatus,
            };
          }
          dateData.physiotherapy.bodyLocationColors.set(
            treatment.bodyLocation,
            treatment.color
          );
        } else if (treatment.treatmentType === "tens") {
          if (!dateData.tens) {
            // Find matching attendance notes
            const matchingAttendance = attendances.find(
              (a) => a.date === sessionDate && a.type === 'tens'
            );
            dateData.tens = {
              bodyLocations: new Set(),
              sessionNumber: sessionRow.sessionNumber, // All treatments on same date have same session number
              plannedSessions: treatment.plannedSessions,
              attendanceId: treatment.attendanceId,
              notes: treatment.notes || "",
              attendanceNotes: matchingAttendance?.notes,
              absenceNotes: matchingAttendance?.absenceNotes,
              sessions: treatment.sessions || [],
              status: treatmentStatus,
            };
          }
          dateData.tens.bodyLocations.add(treatment.bodyLocation);
        }
      }
    });
  });

  return treatmentDataByDate;
};

/**
 * Merge treatment plan data into attendance map
 */
const mergeTreatmentDataIntoAttendances = (
  attendanceMap: Map<string, GroupedAttendance>,
  treatmentDataByDate: Map<string, TreatmentDataByDate>
): void => {
  treatmentDataByDate.forEach((treatmentData, dateKey) => {
    let grouped = attendanceMap.get(dateKey);

    // Create attendance entry if it doesn't exist
    if (!grouped) {
      const attendanceId =
        treatmentData.physiotherapy?.attendanceId || treatmentData.tens?.attendanceId || 0;
      const notes = treatmentData.physiotherapy?.notes || treatmentData.tens?.notes || "";
      
      const ids: string[] = [];
      if (treatmentData.physiotherapy?.attendanceId && !ids.includes(String(treatmentData.physiotherapy.attendanceId)))
        ids.push(String(treatmentData.physiotherapy.attendanceId));
      if (treatmentData.tens?.attendanceId && !ids.includes(String(treatmentData.tens.attendanceId)))
        ids.push(String(treatmentData.tens.attendanceId));

      grouped = {
        date: dateKey.split("-")[0],
        attendanceId: attendanceId.toString(),
        attendanceIds: ids.length > 0 ? ids : [attendanceId.toString()],
        notes,
        absenceNotes: treatmentData.physiotherapy?.attendanceNotes || treatmentData.tens?.attendanceNotes,
        createdDate: dateKey.split("-")[0],
        updatedDate: dateKey.split("-")[0],
        cancelledDate: undefined,
        treatments: {},
      };
      attendanceMap.set(dateKey, grouped);
    }

    // Add physiotherapy treatment data
    if (treatmentData.physiotherapy) {
      grouped.absenceNotes = combineNotes(grouped.absenceNotes, treatmentData.physiotherapy.absenceNotes);
      const locFields = buildPhysiotherapyLocationFieldsFromMap(
        treatmentData.physiotherapy.bodyLocationColors
      );
      grouped.treatments.physiotherapy = {
        ...locFields,
        duration: treatmentData.physiotherapy.duration,
        sessionNumber: `${treatmentData.physiotherapy.sessionNumber}/${treatmentData.physiotherapy.plannedSessions}`,
        notes: treatmentData.physiotherapy.notes,
        attendanceNotes: treatmentData.physiotherapy.attendanceNotes,
        sessions: treatmentData.physiotherapy.sessions,
      };
    }

    // Add tens treatment data
    if (treatmentData.tens) {
      grouped.absenceNotes = combineNotes(grouped.absenceNotes, treatmentData.tens.absenceNotes);
      grouped.treatments.tens = {
        bodyLocations: Array.from(treatmentData.tens.bodyLocations),
        sessionNumber: `${treatmentData.tens.sessionNumber}/${treatmentData.tens.plannedSessions}`,
        notes: treatmentData.tens.notes,
        attendanceNotes: treatmentData.tens.attendanceNotes,
        sessions: treatmentData.tens.sessions,
      };
    }
  });
};

/**
 * Group attendance history by date and combine treatment data
 * @param attendances - Array of previous attendances
 * @param treatments - Treatment plans (`TreatmentResponseDto`) linked to attendances
 * @param consultations - Assessment consultations for recommendation snapshots
 * @returns Array of grouped attendances sorted by date (most recent first)
 */
export const groupHistoryAttendancesByDate = (
  attendances: PreviousAttendance[],
  treatments: TreatmentResponseDto[],
  consultations: ConsultationResponseDto[]
): GroupedAttendance[] => {
  // Step 1: Create base attendance entries
  const attendanceMap = createBaseAttendances(attendances);

  // Step 2: Add assessment treatment data
  mergeConsultationIntoGroupedAttendances(attendanceMap, attendances, consultations);

  // Step 3: Filter treatments to only include those in filtered attendances
  const allowedAttendanceIds = new Set(
    attendances.map((a) => Number(a.attendanceId))
  );
  const filteredTreatments = treatments.filter((session) =>
    allowedAttendanceIds.has(session.attendanceId)
  );

  // Step 4: Group treatments by date + session row status
  const treatmentDataByDate = groupTreatmentsByDateForHistory(filteredTreatments, attendances);

  // Step 5: Merge treatment data into attendances
  mergeTreatmentDataIntoAttendances(attendanceMap, treatmentDataByDate);

  // Step 5: Filter to only include past dates or today's non-scheduled statuses
  const today = getTodayClinic();
  const filteredAttendances = Array.from(attendanceMap.values()).filter((attendance) => {
    if (attendance.date < today) return true; // Past dates
    if (attendance.date === today) {
      // Today: only show if completed, missed, cancelled, checked_in, or in_progress
      return attendance.status && ['completed', 'missed', 'cancelled', 'checked_in', 'in_progress'].includes(attendance.status);
    }
    return false; // Future dates excluded
  });

  // Step 6: Return sorted array (most recent first)
  return filteredAttendances.sort((a, b) => b.date.localeCompare(a.date));
};


// Grouped scheduled attendance by date and treatment type
export interface GroupedScheduledAttendance {
  date: string; // YYYY-MM-DD format
  attendanceId: string;
  /** All attendance IDs in this group (same date); use for reschedule (send all). */
  attendanceIds: string[];
  parentAttendanceId?: number; // Links follow-ups to original consultation
  status?: 'scheduled' | 'checked_in' | 'in_progress' | 'cancelled';
  absenceNotes?: string; // Cancellation reason
  createdDate: string; // YYYY-MM-DD
  updatedDate: string; // YYYY-MM-DD
  cancelledDate?: string; // YYYY-MM-DD (only for cancelled attendances)
  treatments: {
    assessment?: {
      isScheduled: boolean;
      notes?: string; // Attendance notes (reason for scheduling)
    };
    physiotherapy?: {
      bodyLocationsWithColors: Array<{ bodyLocation: string; color?: string }>;
      color?: string;
      duration?: number;
      sessionNumber: string;
      notes?: string;
      attendanceNotes?: string; // Notes from the scheduled attendance
    };
    tens?: {
      bodyLocations: string[];
      sessionNumber: string;
      notes?: string;
      attendanceNotes?: string; // Notes from the scheduled attendance
    };
  };
}

/**
 * Create base scheduled attendance entries
 */
const createBaseScheduledAttendances = (
  scheduledAttendances: {
    attendanceId?: string;
    date: string;
    type: AttendanceType;
    parentAttendanceId?: number;
    status?: 'scheduled' | 'checked_in' | 'in_progress' | 'cancelled';
    absenceNotes?: string;
    notes?: string;
    updatedDate: string;
    createdDate: string;
    cancelledDate?: string;
  }[],
  treatments: TreatmentResponseDto[]
): Map<string, GroupedScheduledAttendance> => {
  const attendanceMap = new Map<string, GroupedScheduledAttendance>();

  scheduledAttendances.forEach((attendance, index) => {
    const dateKey = dateStatusKey(attendance.date, attendance.status);
    const id = attendance.attendanceId ?? treatments[0]?.attendanceId?.toString() ?? `scheduled-${index}`;

    if (!attendanceMap.has(dateKey)) {
      attendanceMap.set(dateKey, {
        date: attendance.date,
        attendanceId: id,
        attendanceIds: [id],
        parentAttendanceId: attendance.parentAttendanceId,
        status: attendance.status,
        absenceNotes: attendance.absenceNotes,
        createdDate: attendance.createdDate,
        updatedDate: attendance.updatedDate,
        cancelledDate: attendance.cancelledDate,
        treatments: {},
      });
    } else {
      const existing = attendanceMap.get(dateKey)!;
      if (!existing.attendanceIds.includes(id)) {
        existing.attendanceIds.push(id);
      }
      if (attendance.parentAttendanceId && !existing.parentAttendanceId) {
        existing.parentAttendanceId = attendance.parentAttendanceId;
      }
      if (attendance.updatedDate >= existing.updatedDate) {
        existing.status = attendance.status;
        existing.absenceNotes = combineNotes(existing.absenceNotes,attendance.absenceNotes);
        existing.updatedDate = attendance.updatedDate;
      }
    }
  });

  return attendanceMap;
};

/**
 * Add scheduled assessment treatment data
 */
const addScheduledAssessmentData = (
  attendanceMap: Map<string, GroupedScheduledAttendance>,
  scheduledAttendances: {
    date: string;
    type: AttendanceType;
    notes?: string;
    status?: 'scheduled' | 'checked_in' | 'in_progress' | 'cancelled';
  }[]
): void => {
  scheduledAttendances.forEach((attendance) => {
    if (attendance.type !== "assessment") return;

    const grouped = attendanceMap.get(dateStatusKey(attendance.date, attendance.status));
    if (!grouped) return;

    grouped.treatments.assessment = {
      isScheduled: true,
      notes: attendance.notes,
    };
  });
};

/**
 * Type definition for scheduled treatment data grouped by date
 */
interface ScheduledTreatmentDataByDate {
  physiotherapy?: {
    bodyLocationColors: Map<string, string | undefined>;
    sessionNumber: number; // Single session number for this date
    duration?: number;
    plannedSessions: number;
    notes: string;
    attendanceNotes?: string; // Notes from the scheduled attendance
    status?: 'completed' | 'missed' | 'cancelled';
  };
  tens?: {
    bodyLocations: Set<string>;
    sessionNumber: number; // Single session number for this date
    plannedSessions: number;
    notes: string;
    attendanceNotes?: string; // Notes from the scheduled attendance
    status?: 'completed' | 'missed' | 'cancelled';
  };
}

/**
 * Group scheduled treatments by date (future session rows only)
 */
const groupScheduledTreatmentsByDate = (
  treatments: TreatmentResponseDto[],
  scheduledAttendances: { date: string; type: AttendanceType; notes?: string }[]
): Map<string, ScheduledTreatmentDataByDate> => {
  const treatmentDataByDate = new Map<string, ScheduledTreatmentDataByDate>();
  const todayStr = getTodayClinic();
  const today = new Date(todayStr + "T00:00:00");

  treatments.forEach((treatment) => {
    const treatmentStatus = treatment.status as 'completed' | 'missed' | 'cancelled';

    treatment.sessions?.forEach((sessionRow) => {
        // Use the session row's scheduled date
        const date = sessionRow.scheduledDate.split("T")[0];
        const dateKey = dateStatusKey(date, sessionRow.status);
        const sessionDate = new Date(date + "T00:00:00");

        // Only include future/scheduled sessions
        if (sessionDate >= today) {

          if (!treatmentDataByDate.has(dateKey)) {
            treatmentDataByDate.set(dateKey, {});
          }

          const dateData = treatmentDataByDate.get(dateKey)!;

          if (treatment.treatmentType === "physiotherapy") {
            if (!dateData.physiotherapy) {
              // Find matching scheduled attendance notes
              const matchingAttendance = scheduledAttendances.find(
                (a) => a.date === date && a.type === 'physiotherapy'
              );
              dateData.physiotherapy = {
                bodyLocationColors: new Map(),
                sessionNumber: sessionRow.sessionNumber, // Use actual session number
                duration: treatment.durationMinutes,
                plannedSessions: treatment.plannedSessions,
                notes: treatment.notes || "",
                attendanceNotes: matchingAttendance?.notes,
                status: treatmentStatus,
              };
            }
            dateData.physiotherapy.bodyLocationColors.set(
              treatment.bodyLocation,
              treatment.color
            );
          } else if (treatment.treatmentType === "tens") {
            if (!dateData.tens) {
              // Find matching scheduled attendance notes
              const matchingAttendance = scheduledAttendances.find(
                (a) => a.date === date && a.type === 'tens'
              );
              dateData.tens = {
                bodyLocations: new Set(),
                sessionNumber: sessionRow.sessionNumber, // Use actual session number
                plannedSessions: treatment.plannedSessions,
                notes: treatment.notes || "",
                attendanceNotes: matchingAttendance?.notes,
                status: treatmentStatus,
              };
            }
            dateData.tens.bodyLocations.add(treatment.bodyLocation);
          }
        }
      });
  });

  return treatmentDataByDate;
};

/**
 * Merge scheduled treatment data into attendance map
 */
const mergeScheduledTreatmentDataIntoAttendances = (
  attendanceMap: Map<string, GroupedScheduledAttendance>,
  treatmentDataByDate: Map<string, ScheduledTreatmentDataByDate>
): void => {
  treatmentDataByDate.forEach((treatmentData, dateKey) => {
    const grouped = attendanceMap.get(dateKey);
    if (!grouped) return;

    // Add physiotherapy treatment data
    if (treatmentData.physiotherapy) {
      const locFields = buildPhysiotherapyLocationFieldsFromMap(
        treatmentData.physiotherapy.bodyLocationColors
      );
      grouped.treatments.physiotherapy = {
        ...locFields,
        duration: treatmentData.physiotherapy.duration,
        sessionNumber: `${treatmentData.physiotherapy.sessionNumber}/${treatmentData.physiotherapy.plannedSessions}`,
        notes: treatmentData.physiotherapy.notes,
        attendanceNotes: treatmentData.physiotherapy.attendanceNotes,
      };
    }

    // Add tens treatment data
    if (treatmentData.tens) {
      grouped.treatments.tens = {
        bodyLocations: Array.from(treatmentData.tens.bodyLocations),
        sessionNumber: `${treatmentData.tens.sessionNumber}/${treatmentData.tens.plannedSessions}`,
        notes: treatmentData.tens.notes,
        attendanceNotes: treatmentData.tens.attendanceNotes,
      };
    }
  });
};

/**
 * Group scheduled attendances by date and combine treatment data
 * @param scheduledAttendances - Array of scheduled attendances
 * @param treatments - Treatment plans (`TreatmentResponseDto`) linked to attendances
 * @returns Array of grouped scheduled attendances sorted by date (earliest first)
 */
export const groupScheduledAttendancesByDate = (
  scheduledAttendances: {
    attendanceId?: string;
    date: string;
    type: AttendanceType;
    parentAttendanceId?: number;
    status?: 'scheduled' | 'checked_in' | 'in_progress' | 'cancelled';
    absenceNotes?: string;
    notes?: string;
    updatedDate: string;
    createdDate: string;
    cancelledDate?: string;
  }[],
  treatments: TreatmentResponseDto[]
): GroupedScheduledAttendance[] => {
  // Step 1: Create base scheduled attendance entries
  const attendanceMap = createBaseScheduledAttendances(scheduledAttendances, treatments);

  // Step 2: Add assessment treatment data
  addScheduledAssessmentData(attendanceMap, scheduledAttendances);

  // Step 3: Group scheduled treatments by date (future session rows)
  const treatmentDataByDate = groupScheduledTreatmentsByDate(treatments, scheduledAttendances);

  // Step 4: Merge treatment data into attendances
  mergeScheduledTreatmentDataIntoAttendances(attendanceMap, treatmentDataByDate);

  // Step 5: Filter to only include future dates or today's scheduled status
  const today = getTodayClinic();
  const filteredAttendances = Array.from(attendanceMap.values()).filter((attendance) => {
    if (attendance.date > today) return true; // Future dates
    if (attendance.date === today) {
      // Today: only show if still scheduled
      return attendance.status === 'scheduled';
    }
    return false; // Past dates excluded
  });

  // Step 6: Return sorted array (earliest first for scheduled)
  return filteredAttendances.sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get treatment types label from attendance treatments
 * @param treatments - Treatment data from grouped attendance (history or scheduled)
 * @param fallbackLabel - Optional fallback label when no treatments found
 * @returns Formatted string with treatment types
 */
export const getTreatmentTypesLabel = (
  treatments: GroupedAttendance["treatments"] | GroupedScheduledAttendance["treatments"],
  fallbackLabel: string = "Tipo não especificado"
): string => {
  const types: string[] = [];

  if (treatments.assessment) {
    types.push("Consulta de Avaliação");
  }
  if (treatments.physiotherapy) {
    types.push("Fisioterapia");
  }
  if (treatments.tens) {
    types.push("TENS");
  }

  return types.length > 0 ? types.join(" + ") : fallbackLabel;
};