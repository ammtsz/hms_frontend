import type {
  TreatmentResponseDto,
  ConsultationResponseDto,
  SessionResponseDto,
  SessionAppointmentStatus,
} from "@/api/types";
import type {
  PreviousAppointment,
  AppointmentType,
  AppointmentWorkflowStatus,
  UpcomingAppointmentStatus,
} from "@/types/types";
import { getTodayClinic, toCalendarDateString } from "@/utils/timezoneDate";

// Grouped appointment by date and treatment type
export interface GroupedAppointment {
  date: string; // YYYY-MM-DD format
  appointmentId: string; // Primary (first) appointment id for backward compatibility
  /** All appointment IDs in this group (same date); use for reschedule (send all). */
  appointmentIds: string[];
  notes: string;
  status?: AppointmentWorkflowStatus;
  absenceNotes?: string; // Absence justification
  absenceJustified?: boolean; // Whether absence was justified
  createdDate: string; // YY-MM-DD
  updatedDate: string; // YY-MM-DD
  cancelledDate?: string; // YYYY-MM-DD (only for cancelled appointments)
  treatments: {
    assessment?: {
      notes?: string; // Appointment notes
      /** Notes from the assessment consultation (`hms_consultation`). */
      consultationNotes?: string;
      consultationId?: number;
      recommendations?: {
        homeExercises?: string;
        painManagement?: string;
        medications?: string;
        physiotherapy?: boolean;
        tens?: boolean;
        returnWeeks?: number;
        returnWhenTreatmentComplete?: boolean;
      };
    };
    physiotherapy?: {
      bodyLocations: string[];
      durationMinutes?: number;
      /** Display fraction completed/total (e.g. `"2/5"`). */
      sessionNumber: string;
      notes?: string;
      appointmentNotes?: string;
      sessions?: SessionResponseDto[];
    };
    tens?: {
      bodyLocations: string[];
      durationMinutes?: number;
      sessionNumber: string; // Format: "2/5" (completed/total)
      notes?: string; // Treatment notes
      appointmentNotes?: string; // Notes from the appointment
      sessions?: SessionResponseDto[];
    };
  };
}

/** Build map key from date and status so same-day appointments with different statuses stay separate */
const dateStatusKey = (date: string, status?: string): string =>
  `${toCalendarDateString(date)}-${status ?? "completed"}`;

/** Extract YYYY-MM-DD from a date-status map key (e.g. `2026-03-11-completed`). */
const parseDateFromDateStatusKey = (dateKey: string): string => {
  const match = dateKey.match(/^(\d{4}-\d{2}-\d{2})-/);
  return match ? match[1] : toCalendarDateString(dateKey);
};

/** Combine notes from different appointments on the same date */
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

const buildPhysiotherapyLocationFieldsFromSet = (
  bodyLocations: Set<string>,
): { bodyLocations: string[] } => ({
  bodyLocations: Array.from(bodyLocations),
});

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
 * Create base appointment entries from appointment data.
 * Groups by date + status so e.g. same-day "completed" assessment and "cancelled" physiotherapy appear as separate items.
 */
const createBaseAppointments = (
  appointments: PreviousAppointment[]
): Map<string, GroupedAppointment> => {
  const appointmentMap = new Map<string, GroupedAppointment>();

  appointments.forEach((appointment) => {
    const key = dateStatusKey(appointment.date, appointment.status);

    if (!appointmentMap.has(key)) {
      appointmentMap.set(key, {
        date: toCalendarDateString(appointment.date),
        appointmentId: appointment.appointmentId,
        appointmentIds: [appointment.appointmentId],
        notes: appointment.notes,
        status: appointment.status,
        absenceNotes: appointment.absenceNotes,
        absenceJustified: appointment.absenceJustified,
        createdDate: appointment.createdDate,
        updatedDate: appointment.updatedDate,
        cancelledDate: appointment.cancelledDate,
        treatments: {},
      });
    } else {
      const grouped = appointmentMap.get(key)!;
      if (!grouped.appointmentIds.includes(appointment.appointmentId)) {
        grouped.appointmentIds.push(appointment.appointmentId);
      }
    }
  });

  return appointmentMap;
};

/**
 * Attach consultation snapshot (recommendations, notes) to grouped assessment appointments.
 */
const mergeConsultationIntoGroupedAppointments = (
  appointmentMap: Map<string, GroupedAppointment>,
  appointments: PreviousAppointment[],
  consultations: ConsultationResponseDto[]
): void => {
  appointments.forEach((appointment) => {
    if (appointment.type !== "assessment") return;

    const key = dateStatusKey(appointment.date, appointment.status);
    const grouped = appointmentMap.get(key);
    if (!grouped) return;

    const consultation = consultations.find(
      (c) => c.appointmentId === Number(appointment.appointmentId),
    );

    grouped.treatments.assessment = {
      notes: appointment.notes,
      consultationNotes: consultation?.notes,
      consultationId: consultation?.id,
      recommendations: consultation
        ? {
            homeExercises: consultation.homeExercises || "",
            painManagement: consultation.painManagement || "",
            medications: consultation.medications || "",
            physiotherapy: consultation.physiotherapy || false,
            tens: consultation.tens || false,
            returnWeeks: consultation.returnWeeks || 0,
            returnWhenTreatmentComplete: consultation.returnWhenTreatmentComplete || false,
          }
        : appointment.recommendations || undefined,
    };
  });
};

/**
 * Type definition for treatment data grouped by date
 */
interface TreatmentDataByDate {
  physiotherapy?: {
    bodyLocations: Set<string>;
    sessionNumber: number;
    durationMinutes?: number;
    plannedSessions: number;
    appointmentId: number;
    notes: string;
    appointmentNotes?: string;
    absenceNotes?: string;
    sessions: SessionResponseDto[];
    status?: SessionAppointmentStatus;
  };
  tens?: {
    bodyLocations: Set<string>;
    sessionNumber: number;
    durationMinutes?: number;
    plannedSessions: number;
    appointmentId: number;
    notes: string;
    appointmentNotes?: string; // Notes from the appointment
    absenceNotes?: string; // Absence justification
    sessions: SessionResponseDto[];
    status?: SessionAppointmentStatus;
  };
}

/**
 * Group treatments (with session rows) by date + status so they merge into the correct appointment group.
 */
const groupTreatmentsByDateForHistory = (
  treatments: TreatmentResponseDto[],
  appointments: PreviousAppointment[]
): Map<string, TreatmentDataByDate> => {
  const treatmentDataByDate = new Map<string, TreatmentDataByDate>();
  const clinicToday = getTodayClinic();

  treatments.forEach((treatment) => {
    treatment.sessions?.forEach((sessionRow) => {
      const sessionRowStatus = sessionRow.status;
      const sessionDate = toCalendarDateString(sessionRow.scheduledDate);
      const isResolvedSession =
        sessionRowStatus === "completed" ||
        sessionRowStatus === "missed" ||
        sessionRowStatus === "cancelled";
      // Session rows only use scheduled|completed|missed|cancelled (not appointment
      // progression statuses like checked_in / in_progress).
      const isOpenSession = sessionRowStatus === "scheduled";

      // History: resolved sessions on/before today, plus past open sessions
      // (unresolved-past). Today's open sessions belong in Upcoming.
      const includeInHistory =
        (isResolvedSession && sessionDate <= clinicToday) ||
        (isOpenSession && sessionDate < clinicToday);

      if (!includeInHistory) {
        return;
      }

      const dateKey = dateStatusKey(sessionDate, sessionRowStatus);

      if (!treatmentDataByDate.has(dateKey)) {
        treatmentDataByDate.set(dateKey, {});
      }

      const dateData = treatmentDataByDate.get(dateKey)!;
      const sessionStatus = sessionRowStatus;

      if (treatment.treatmentType === "physiotherapy") {
        if (!dateData.physiotherapy) {
            const matchingAppointment = appointments.find(
              (a) =>
                toCalendarDateString(a.date) === sessionDate &&
                a.type === "physiotherapy",
            );
          dateData.physiotherapy = {
            bodyLocations: new Set(),
            sessionNumber: sessionRow.sessionNumber,
            durationMinutes: treatment.durationMinutes,
            plannedSessions: treatment.plannedSessions,
            appointmentId:
              sessionRow.appointmentId ?? treatment.appointmentId,
            notes: treatment.notes || "",
            appointmentNotes: matchingAppointment?.notes,
            absenceNotes: matchingAppointment?.absenceNotes,
            sessions: treatment.sessions || [],
            status: sessionStatus,
          };
        }
        dateData.physiotherapy.bodyLocations.add(treatment.bodyLocation);
      } else if (treatment.treatmentType === "tens") {
        if (!dateData.tens) {
            const matchingAppointment = appointments.find(
              (a) =>
                toCalendarDateString(a.date) === sessionDate &&
                a.type === "tens",
            );
          dateData.tens = {
            bodyLocations: new Set(),
            sessionNumber: sessionRow.sessionNumber,
            durationMinutes: treatment.durationMinutes,
            plannedSessions: treatment.plannedSessions,
            appointmentId:
              sessionRow.appointmentId ?? treatment.appointmentId,
            notes: treatment.notes || "",
            appointmentNotes: matchingAppointment?.notes,
            absenceNotes: matchingAppointment?.absenceNotes,
            sessions: treatment.sessions || [],
            status: sessionStatus,
          };
        }
        dateData.tens.bodyLocations.add(treatment.bodyLocation);
      }
    });
  });

  return treatmentDataByDate;
};

/**
 * Merge treatment plan data into appointment map
 */
const mergeTreatmentDataIntoAppointments = (
  appointmentMap: Map<string, GroupedAppointment>,
  treatmentDataByDate: Map<string, TreatmentDataByDate>
): void => {
  treatmentDataByDate.forEach((treatmentData, dateKey) => {
    let grouped = appointmentMap.get(dateKey);

    // Create appointment entry if it doesn't exist
    if (!grouped) {
      const appointmentId =
        treatmentData.physiotherapy?.appointmentId || treatmentData.tens?.appointmentId || 0;
      const notes = treatmentData.physiotherapy?.notes || treatmentData.tens?.notes || "";
      
      const ids: string[] = [];
      if (treatmentData.physiotherapy?.appointmentId && !ids.includes(String(treatmentData.physiotherapy.appointmentId)))
        ids.push(String(treatmentData.physiotherapy.appointmentId));
      if (treatmentData.tens?.appointmentId && !ids.includes(String(treatmentData.tens.appointmentId)))
        ids.push(String(treatmentData.tens.appointmentId));

      grouped = {
        date: parseDateFromDateStatusKey(dateKey),
        appointmentId: appointmentId.toString(),
        appointmentIds: ids.length > 0 ? ids : [appointmentId.toString()],
        notes,
        status:
          treatmentData.physiotherapy?.status ||
          treatmentData.tens?.status ||
          "completed",
        absenceNotes: treatmentData.physiotherapy?.appointmentNotes || treatmentData.tens?.appointmentNotes,
        createdDate: parseDateFromDateStatusKey(dateKey),
        updatedDate: parseDateFromDateStatusKey(dateKey),
        cancelledDate: undefined,
        treatments: {},
      };
      appointmentMap.set(dateKey, grouped);
    }

    // Add physiotherapy treatment data
    if (treatmentData.physiotherapy) {
      grouped.absenceNotes = combineNotes(grouped.absenceNotes, treatmentData.physiotherapy.absenceNotes);
      const locFields = buildPhysiotherapyLocationFieldsFromSet(
        treatmentData.physiotherapy.bodyLocations,
      );
      grouped.treatments.physiotherapy = {
        ...locFields,
        durationMinutes: treatmentData.physiotherapy.durationMinutes,
        sessionNumber: `${treatmentData.physiotherapy.sessionNumber}/${treatmentData.physiotherapy.plannedSessions}`,
        notes: treatmentData.physiotherapy.notes,
        appointmentNotes: treatmentData.physiotherapy.appointmentNotes,
        sessions: treatmentData.physiotherapy.sessions,
      };
    }

    if (treatmentData.tens) {
      grouped.absenceNotes = combineNotes(grouped.absenceNotes, treatmentData.tens.absenceNotes);
      grouped.treatments.tens = {
        bodyLocations: Array.from(treatmentData.tens.bodyLocations),
        durationMinutes: treatmentData.tens.durationMinutes,
        sessionNumber: `${treatmentData.tens.sessionNumber}/${treatmentData.tens.plannedSessions}`,
        notes: treatmentData.tens.notes,
        appointmentNotes: treatmentData.tens.appointmentNotes,
        sessions: treatmentData.tens.sessions,
      };
    }
  });
};

/**
 * Group appointment history by date and combine treatment data
 * @param appointments - Array of previous appointments
 * @param treatments - Treatment plans (`TreatmentResponseDto`) linked to appointments
 * @param consultations - Assessment consultations for recommendation snapshots
 * @returns Array of grouped appointments sorted by date (most recent first)
 */
export const groupHistoryAppointmentsByDate = (
  appointments: PreviousAppointment[],
  treatments: TreatmentResponseDto[],
  consultations: ConsultationResponseDto[]
): GroupedAppointment[] => {
  // Step 1: Create base appointment entries
  const appointmentMap = createBaseAppointments(appointments);

  // Step 2: Add assessment treatment data
  mergeConsultationIntoGroupedAppointments(appointmentMap, appointments, consultations);

  // Step 3: Filter treatments to only include those in filtered appointments
  const allowedAppointmentIds = new Set(
    appointments.map((a) => Number(a.appointmentId))
  );
  const filteredTreatments = treatments.filter((session) =>
    allowedAppointmentIds.has(session.appointmentId)
  );

  // Step 4: Group treatments by date + session row status
  const treatmentDataByDate = groupTreatmentsByDateForHistory(filteredTreatments, appointments);

  // Step 5: Merge treatment data into appointments
  mergeTreatmentDataIntoAppointments(appointmentMap, treatmentDataByDate);

  // Step 5: Past dates (any status, including unresolved scheduled) + today only
  // when resolved. Today's open slots stay under Upcoming Appointments.
  const today = getTodayClinic();
  const openStatuses = new Set(["scheduled", "checked_in", "in_progress"]);
  const filteredAppointments = Array.from(appointmentMap.values()).filter(
    (appointment) => {
      if (appointment.date < today) return true;
      if (appointment.date === today) {
        return !appointment.status || !openStatuses.has(appointment.status);
      }
      return false;
    },
  );

  // Step 6: Return sorted array (most recent first)
  return filteredAppointments.sort((a, b) => b.date.localeCompare(a.date));
};


// Grouped scheduled appointment by date and treatment type
export interface GroupedScheduledAppointment {
  date: string; // YYYY-MM-DD format
  appointmentId: string;
  /** All appointment IDs in this group (same date); use for reschedule (send all). */
  appointmentIds: string[];
  parentAppointmentId?: number; // Links follow-ups to original consultation
  status?: UpcomingAppointmentStatus;
  absenceNotes?: string; // Cancellation reason
  createdDate: string; // YYYY-MM-DD
  updatedDate: string; // YYYY-MM-DD
  cancelledDate?: string; // YYYY-MM-DD (only for cancelled appointments)
  treatments: {
    assessment?: {
      isScheduled: boolean;
      notes?: string; // Appointment notes (reason for scheduling)
    };
    physiotherapy?: {
      bodyLocations: string[];
      durationMinutes?: number;
      sessionNumber: string;
      notes?: string;
      appointmentNotes?: string;
    };
    tens?: {
      bodyLocations: string[];
      durationMinutes?: number;
      sessionNumber: string;
      notes?: string;
      appointmentNotes?: string; // Notes from the scheduled appointment
    };
  };
}

/**
 * Create base scheduled appointment entries
 */
const createBaseScheduledAppointments = (
  scheduledAppointments: {
    appointmentId?: string;
    date: string;
    type: AppointmentType;
    parentAppointmentId?: number;
    status?: UpcomingAppointmentStatus;
    absenceNotes?: string;
    notes?: string;
    updatedDate: string;
    createdDate: string;
    cancelledDate?: string;
  }[],
  treatments: TreatmentResponseDto[]
): Map<string, GroupedScheduledAppointment> => {
  const appointmentMap = new Map<string, GroupedScheduledAppointment>();

  scheduledAppointments.forEach((appointment, index) => {
    const dateKey = dateStatusKey(appointment.date, appointment.status);
    const id = appointment.appointmentId ?? treatments[0]?.appointmentId?.toString() ?? `scheduled-${index}`;

    if (!appointmentMap.has(dateKey)) {
      appointmentMap.set(dateKey, {
        date: appointment.date,
        appointmentId: id,
        appointmentIds: [id],
        parentAppointmentId: appointment.parentAppointmentId,
        status: appointment.status,
        absenceNotes: appointment.absenceNotes,
        createdDate: appointment.createdDate,
        updatedDate: appointment.updatedDate,
        cancelledDate: appointment.cancelledDate,
        treatments: {},
      });
    } else {
      const existing = appointmentMap.get(dateKey)!;
      if (!existing.appointmentIds.includes(id)) {
        existing.appointmentIds.push(id);
      }
      if (appointment.parentAppointmentId && !existing.parentAppointmentId) {
        existing.parentAppointmentId = appointment.parentAppointmentId;
      }
      if (appointment.updatedDate >= existing.updatedDate) {
        existing.status = appointment.status;
        existing.absenceNotes = combineNotes(existing.absenceNotes,appointment.absenceNotes);
        existing.updatedDate = appointment.updatedDate;
      }
    }
  });

  return appointmentMap;
};

/**
 * Add scheduled assessment treatment data
 */
const addScheduledAssessmentData = (
  appointmentMap: Map<string, GroupedScheduledAppointment>,
  scheduledAppointments: {
    date: string;
    type: AppointmentType;
    notes?: string;
    status?: UpcomingAppointmentStatus;
  }[]
): void => {
  scheduledAppointments.forEach((appointment) => {
    if (appointment.type !== "assessment") return;

    const grouped = appointmentMap.get(dateStatusKey(appointment.date, appointment.status));
    if (!grouped) return;

    grouped.treatments.assessment = {
      isScheduled: true,
      notes: appointment.notes,
    };
  });
};

/**
 * Type definition for scheduled treatment data grouped by date
 */
interface ScheduledTreatmentDataByDate {
  physiotherapy?: {
    bodyLocations: Set<string>;
    sessionNumber: number;
    durationMinutes?: number;
    plannedSessions: number;
    notes: string;
    appointmentNotes?: string;
    status?: SessionAppointmentStatus;
  };
  tens?: {
    bodyLocations: Set<string>;
    sessionNumber: number;
    durationMinutes?: number;
    plannedSessions: number;
    notes: string;
    appointmentNotes?: string; // Notes from the scheduled appointment
    status?: SessionAppointmentStatus;
  };
}

/**
 * Group scheduled treatments by date (future session rows only)
 */
const groupScheduledTreatmentsByDate = (
  treatments: TreatmentResponseDto[],
  scheduledAppointments: { date: string; type: AppointmentType; notes?: string }[]
): Map<string, ScheduledTreatmentDataByDate> => {
  const treatmentDataByDate = new Map<string, ScheduledTreatmentDataByDate>();
  const todayStr = getTodayClinic();
  const today = new Date(todayStr + "T00:00:00");

  treatments.forEach((treatment) => {
  const treatmentStatus = treatment.status as SessionAppointmentStatus;

  treatment.sessions?.forEach((sessionRow) => {
        // Use the session row's scheduled date
        const date = toCalendarDateString(sessionRow.scheduledDate);
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
              // Find matching scheduled appointment notes
              const matchingAppointment = scheduledAppointments.find(
                (a) => a.date === date && a.type === 'physiotherapy'
              );
              dateData.physiotherapy = {
                bodyLocations: new Set(),
                sessionNumber: sessionRow.sessionNumber,
                durationMinutes: treatment.durationMinutes,
                plannedSessions: treatment.plannedSessions,
                notes: treatment.notes || "",
                appointmentNotes: matchingAppointment?.notes,
                status: treatmentStatus,
              };
            }
            dateData.physiotherapy.bodyLocations.add(treatment.bodyLocation);
          } else if (treatment.treatmentType === "tens") {
            if (!dateData.tens) {
              const matchingAppointment = scheduledAppointments.find(
                (a) => a.date === date && a.type === 'tens'
              );
              dateData.tens = {
                bodyLocations: new Set(),
                sessionNumber: sessionRow.sessionNumber,
                durationMinutes: treatment.durationMinutes,
                plannedSessions: treatment.plannedSessions,
                notes: treatment.notes || "",
                appointmentNotes: matchingAppointment?.notes,
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
 * Merge scheduled treatment data into appointment map
 */
const mergeScheduledTreatmentDataIntoAppointments = (
  appointmentMap: Map<string, GroupedScheduledAppointment>,
  treatmentDataByDate: Map<string, ScheduledTreatmentDataByDate>
): void => {
  treatmentDataByDate.forEach((treatmentData, dateKey) => {
    const grouped = appointmentMap.get(dateKey);
    if (!grouped) return;

    // Add physiotherapy treatment data
    if (treatmentData.physiotherapy) {
      const locFields = buildPhysiotherapyLocationFieldsFromSet(
        treatmentData.physiotherapy.bodyLocations,
      );
      grouped.treatments.physiotherapy = {
        ...locFields,
        durationMinutes: treatmentData.physiotherapy.durationMinutes,
        sessionNumber: `${treatmentData.physiotherapy.sessionNumber}/${treatmentData.physiotherapy.plannedSessions}`,
        notes: treatmentData.physiotherapy.notes,
        appointmentNotes: treatmentData.physiotherapy.appointmentNotes,
      };
    }

    if (treatmentData.tens) {
      grouped.treatments.tens = {
        bodyLocations: Array.from(treatmentData.tens.bodyLocations),
        durationMinutes: treatmentData.tens.durationMinutes,
        sessionNumber: `${treatmentData.tens.sessionNumber}/${treatmentData.tens.plannedSessions}`,
        notes: treatmentData.tens.notes,
        appointmentNotes: treatmentData.tens.appointmentNotes,
      };
    }
  });
};

/**
 * Group scheduled appointments by date and combine treatment data
 * @param scheduledAppointments - Array of scheduled appointments
 * @param treatments - Treatment plans (`TreatmentResponseDto`) linked to appointments
 * @returns Array of grouped scheduled appointments sorted by date (earliest first)
 */
export const groupScheduledAppointmentsByDate = (
  scheduledAppointments: {
    appointmentId?: string;
    date: string;
    type: AppointmentType;
    parentAppointmentId?: number;
    status?: UpcomingAppointmentStatus;
    absenceNotes?: string;
    notes?: string;
    updatedDate: string;
    createdDate: string;
    cancelledDate?: string;
  }[],
  treatments: TreatmentResponseDto[]
): GroupedScheduledAppointment[] => {
  // Step 1: Create base scheduled appointment entries
  const appointmentMap = createBaseScheduledAppointments(scheduledAppointments, treatments);

  // Step 2: Add assessment treatment data
  addScheduledAssessmentData(appointmentMap, scheduledAppointments);

  // Step 3: Group scheduled treatments by date (future session rows)
  const treatmentDataByDate = groupScheduledTreatmentsByDate(treatments, scheduledAppointments);

  // Step 4: Merge treatment data into appointments
  mergeScheduledTreatmentDataIntoAppointments(appointmentMap, treatmentDataByDate);

  // Step 5: Filter to only include future dates or today's scheduled status
  const today = getTodayClinic();
  const filteredAppointments = Array.from(appointmentMap.values()).filter((appointment) => {
    if (appointment.date > today) return true; // Future dates
    if (appointment.date === today) {
      // Today: only show if still scheduled
      return appointment.status === 'scheduled';
    }
    return false; // Past dates excluded
  });

  // Step 6: Return sorted array (earliest first for scheduled)
  return filteredAppointments.sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get treatment types label from appointment treatments
 * @param treatments - Treatment data from grouped appointment (history or scheduled)
 * @param fallbackLabel - Optional fallback label when no treatments found
 * @returns Formatted string with treatment types
 */
export const getTreatmentTypesLabel = (
  treatments: GroupedAppointment["treatments"] | GroupedScheduledAppointment["treatments"],
  fallbackLabel: string = "Unspecified type"
): string => {
  const types: string[] = [];

  if (treatments.assessment) {
    types.push("Assessment Consultation");
  }
  if (treatments.physiotherapy) {
    types.push("Physiotherapy");
  }
  if (treatments.tens) {
    types.push("TENS");
  }

  return types.length > 0 ? types.join(" + ") : fallbackLabel;
};