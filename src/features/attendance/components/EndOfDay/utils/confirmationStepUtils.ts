import type { AbsenceJustification, ScheduledAbsence } from "../types";
import { getAttendanceTypeLabel } from "@/utils/apiTransformers";
import type {
  GroupedAttendanceDisplay,
  IAttendanceStatusDetailWithType,
} from "../../../utils/attendanceDataUtils";

/** Grouped attendance with locais (body location) counts for treatments. Used in ConfirmationStep. */
export interface GroupedAttendanceDisplayWithLocais extends GroupedAttendanceDisplay {
  physiotherapyCount?: number;
  tensCount?: number;
}

/** One card = one Kanban card (patient + assessment|treatments). Used for counts and display. */
export interface AbsenceCard {
  patientId: number;
  patientName: string;
  hasAssessment: boolean;
  physiotherapyCount: number;
  tensCount: number;
  justification?: string;
  justified: boolean;
}

/** Group scheduled absences by card (patient + assessment|treatments). Count by cards, not individual attendances. */
export function groupAbsenceJustificationsByCard(
  scheduledAbsences: ScheduledAbsence[],
  absenceJustifications: AbsenceJustification[],
): AbsenceCard[] {
  const byPatient = new Map<
    number,
    {
      patientName: string;
      assessment: ScheduledAbsence[];
      treatments: ScheduledAbsence[];
    }
  >();

  for (const absence of scheduledAbsences) {
    const pid = absence.patientId;
    if (!byPatient.has(pid)) {
      byPatient.set(pid, {
        patientName: absence.patientName,
        assessment: [],
        treatments: [],
      });
    }
    const g = byPatient.get(pid)!;
    if (absence.attendanceType === "assessment") {
      g.assessment.push(absence);
    } else {
      g.treatments.push(absence);
    }
  }

  // When scheduledAbsences is empty but we have justifications (e.g. in tests), derive from justifications
  if (byPatient.size === 0 && absenceJustifications.length > 0) {
    for (const j of absenceJustifications) {
      const pid = j.patientId;
      if (!byPatient.has(pid)) {
        byPatient.set(pid, {
          patientName: j.patientName,
          assessment: [],
          treatments: [],
        });
      }
      const g = byPatient.get(pid)!;
      if (j.attendanceType === "assessment") {
        g.assessment.push({
          patientId: pid,
          patientName: j.patientName,
          attendanceType: "assessment",
        });
      } else {
        g.treatments.push({
          patientId: pid,
          patientName: j.patientName,
          attendanceType: j.attendanceType as "physiotherapy" | "tens",
        });
      }
    }
  }

  const cards: AbsenceCard[] = [];

  byPatient.forEach((group, patientId) => {
    const getJustification = (type: "assessment" | "treatments") => {
      if (type === "assessment") {
        return absenceJustifications.find(
          (j) => j.patientId === patientId && j.attendanceType === "assessment",
        );
      }
      return absenceJustifications.find(
        (j) =>
          j.patientId === patientId &&
          (j.attendanceType === "physiotherapy" || j.attendanceType === "tens"),
      );
    };

    if (group.assessment.length > 0) {
      const j = getJustification("assessment");
      cards.push({
        patientId,
        patientName: group.patientName,
        hasAssessment: true,
        physiotherapyCount: 0,
        tensCount: 0,
        justification: j?.justification,
        justified: j?.justified ?? false,
      });
    }

    if (group.treatments.length > 0) {
      const physiotherapyCount = group.treatments.filter(
        (t) => t.attendanceType === "physiotherapy",
      ).length;
      const tensCount = group.treatments.filter(
        (t) => t.attendanceType === "tens",
      ).length;
      const j = getJustification("treatments");
      cards.push({
        patientId,
        patientName: group.patientName,
        hasAssessment: false,
        physiotherapyCount,
        tensCount,
        justification: j?.justification,
        justified: j?.justified ?? false,
      });
    }
  });

  return cards;
}

export function getAbsenceCardLabelParts(card: AbsenceCard): string[] {
  if (card.hasAssessment) {
    return [getAttendanceTypeLabel("assessment")];
  }
  const parts: string[] = [];
  if (card.physiotherapyCount > 0) {
    parts.push(
      `${getAttendanceTypeLabel("physiotherapy")} (${card.physiotherapyCount} ${card.physiotherapyCount === 1 ? "local" : "locais"})`,
    );
  }
  if (card.tensCount > 0) {
    parts.push(
      `${getAttendanceTypeLabel("tens")} (${card.tensCount} ${card.tensCount === 1 ? "local" : "locais"})`,
    );
  }
  return parts;
}

/**
 * Groups attendances with locais (body location) counts for treatment types.
 * Each attendance = 1 local. Used in ConfirmationStep for "Fisioterapia - 1 local" format.
 */
export function groupAttendancesForDisplayWithBodyLocation(
  attendances: IAttendanceStatusDetailWithType[],
): GroupedAttendanceDisplayWithLocais[] {
  const patientGroups = new Map<
    string,
    {
      patientName: string;
      patientId?: number;
      assessmentCount: number;
      physiotherapyCount: number;
      tensCount: number;
    }
  >();

  attendances.forEach((attendance) => {
    const key = attendance.patientId?.toString() || attendance.name;
    const existing = patientGroups.get(key);

    if (existing) {
      if (attendance.attendanceType === "assessment") {
        existing.assessmentCount += 1;
      } else if (attendance.attendanceType === "physiotherapy") {
        existing.physiotherapyCount += 1;
      } else if (attendance.attendanceType === "tens") {
        existing.tensCount += 1;
      }
    } else {
      patientGroups.set(key, {
        patientName: attendance.name,
        patientId: attendance.patientId,
        assessmentCount: attendance.attendanceType === "assessment" ? 1 : 0,
        physiotherapyCount: attendance.attendanceType === "physiotherapy" ? 1 : 0,
        tensCount: attendance.attendanceType === "tens" ? 1 : 0,
      });
    }
  });

  const result: GroupedAttendanceDisplayWithLocais[] = [];

  patientGroups.forEach((group) => {
    const hasTreatments = group.physiotherapyCount > 0 || group.tensCount > 0;

    if (group.assessmentCount > 0 && hasTreatments) {
      result.push({
        patientName: group.patientName,
        patientId: group.patientId,
        label: getAttendanceTypeLabel("assessment"),
      });

      const treatmentParts: string[] = [];
      if (group.physiotherapyCount > 0) {
        treatmentParts.push(
          `${getAttendanceTypeLabel("physiotherapy")} - ${group.physiotherapyCount} ${group.physiotherapyCount === 1 ? "local" : "locais"}`,
        );
      }
      if (group.tensCount > 0) {
        treatmentParts.push(
          `${getAttendanceTypeLabel("tens")} - ${group.tensCount} ${group.tensCount === 1 ? "local" : "locais"}`,
        );
      }
      result.push({
        patientName: group.patientName,
        patientId: group.patientId,
        label: treatmentParts.join(" e "),
        physiotherapyCount: group.physiotherapyCount,
        tensCount: group.tensCount,
      });
    } else if (group.assessmentCount > 0) {
      result.push({
        patientName: group.patientName,
        patientId: group.patientId,
        label: getAttendanceTypeLabel("assessment"),
      });
    } else if (hasTreatments) {
      const treatmentParts: string[] = [];
      if (group.physiotherapyCount > 0) {
        treatmentParts.push(
          `${getAttendanceTypeLabel("physiotherapy")} - ${group.physiotherapyCount} ${group.physiotherapyCount === 1 ? "local" : "locais"}`,
        );
      }
      if (group.tensCount > 0) {
        treatmentParts.push(
          `${getAttendanceTypeLabel("tens")} - ${group.tensCount} ${group.tensCount === 1 ? "local" : "locais"}`,
        );
      }
      result.push({
        patientName: group.patientName,
        patientId: group.patientId,
        label: treatmentParts.join(" e "),
        physiotherapyCount: group.physiotherapyCount,
        tensCount: group.tensCount,
      });
    }
  });

  return result;
}
