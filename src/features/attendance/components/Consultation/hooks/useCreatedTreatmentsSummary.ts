import { useMemo } from "react";
import type { AttendanceResponseDto, SessionResponseDto } from "@/api/types";
import {
  addCalendarDaysToLocalYmd,
  toCalendarDateString,
} from "@/utils/timezoneDate";
import type { CreatedTreatment } from "../components/CreatedTreatmentsConfirmation";

/**
 * Derives display data for created treatment plans and related attendances.
 */
export const useCreatedTreatmentsSummary = (
  createdTreatments: CreatedTreatment[],
  newlyScheduledAttendances?: AttendanceResponseDto[],
) => {
  // Nominal weekly dates from start (fallback only; does not apply holiday shifts)
  const getNominalWeeklyDates = (
    treatment: CreatedTreatment,
  ): Array<{ date: string; time?: string }> => {
    const start = toCalendarDateString(treatment.startDate);
    const dates: Array<{ date: string; time?: string }> = [];
    let current = start;
    for (let i = 0; i < treatment.plannedSessions; i++) {
      dates.push({ date: current });
      current = addCalendarDaysToLocalYmd(current, 7);
    }
    return dates;
  };

  const getDatesFromSessions = (
    sessions: SessionResponseDto[],
    plannedSessions: number,
  ): Array<{ date: string; time?: string }> => {
    return [...sessions]
      .sort((a, b) => a.sessionNumber - b.sessionNumber)
      .slice(0, plannedSessions)
      .map((session) => ({
        date: toCalendarDateString(session.scheduledDate),
        time: session.startTime,
      }));
  };

  // Get actual scheduled dates (session rows first, then attendances, then nominal weekly)
  const getScheduledDatesFromAttendances = (
    treatment: CreatedTreatment,
  ): Array<{ date: string; time?: string }> => {
    if (treatment.sessions && treatment.sessions.length > 0) {
      return getDatesFromSessions(treatment.sessions, treatment.plannedSessions);
    }

    if (!newlyScheduledAttendances || newlyScheduledAttendances.length === 0) {
      return getNominalWeeklyDates(treatment);
    }

    const attendancesByType = newlyScheduledAttendances
      .filter((att) => {
        const typeMatch =
          treatment.treatmentType === "physiotherapy"
            ? att.type === "physiotherapy"
            : att.type === "tens";
        return typeMatch && att.status === "scheduled";
      })
      .sort((a, b) => a.id - b.id);

    const treatmentsOfSameType = createdTreatments
      .filter((t) => t.treatmentType === treatment.treatmentType)
      .sort((a, b) => a.id - b.id);

    const treatmentIndex = treatmentsOfSameType.findIndex(
      (t) => t.id === treatment.id,
    );

    if (treatmentIndex === -1) {
      return [];
    }

    let offset = 0;
    for (let i = 0; i < treatmentIndex; i++) {
      offset += treatmentsOfSameType[i].plannedSessions;
    }

    const planAttendances = attendancesByType.slice(
      offset,
      offset + treatment.plannedSessions,
    );

    if (planAttendances.length === 0) {
      return getNominalWeeklyDates(treatment);
    }

    return planAttendances.map((att) => ({
      date: toCalendarDateString(att.scheduledDate),
      time: att.scheduledTime,
    }));
  };

  const physiotherapySessions = useMemo(
    () => createdTreatments.filter((t) => t.treatmentType === "physiotherapy"),
    [createdTreatments],
  );

  const tensSessions = useMemo(
    () => createdTreatments.filter((t) => t.treatmentType === "tens"),
    [createdTreatments],
  );

  const totalAppointments = useMemo(
    () => createdTreatments.reduce((sum, t) => sum + t.plannedSessions, 0),
    [createdTreatments],
  );

  const nextAssessmentConsultation = useMemo(() => {
    if (!newlyScheduledAttendances || newlyScheduledAttendances.length === 0) {
      return null;
    }

    const assessmentAttendances = newlyScheduledAttendances
      .filter((att) => att.type === "assessment" && att.status === "scheduled")
      .sort((a, b) =>
        toCalendarDateString(a.scheduledDate).localeCompare(
          toCalendarDateString(b.scheduledDate),
        ),
      );

    return assessmentAttendances[0] || null;
  }, [newlyScheduledAttendances]);

  return {
    physiotherapySessions,
    tensSessions,
    totalAppointments,
    nextAssessmentConsultation,
    getScheduledDatesFromAttendances,
  };
};
