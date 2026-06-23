import type { AbsenceJustification, ScheduledAbsence } from "../types";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";
import type {
  GroupedAppointmentDisplay,
  IAppointmentStatusDetailWithType,
} from "../../../utils/appointmentDataUtils";

/** Grouped appointment with body location counts for treatments. Used in ConfirmationStep. */
export interface GroupedAppointmentDisplayWithBodyLocation extends GroupedAppointmentDisplay {
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

/** Group scheduled absences by card (patient + assessment|treatments). Count by cards, not individual appointments. */
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
    if (absence.appointmentType === "assessment") {
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
      if (j.appointmentType === "assessment") {
        g.assessment.push({
          patientId: pid,
          patientName: j.patientName,
          appointmentType: "assessment",
        });
      } else {
        g.treatments.push({
          patientId: pid,
          patientName: j.patientName,
          appointmentType: j.appointmentType as "physiotherapy" | "tens",
        });
      }
    }
  }

  const cards: AbsenceCard[] = [];

  byPatient.forEach((group, patientId) => {
    const getJustification = (type: "assessment" | "treatments") => {
      if (type === "assessment") {
        return absenceJustifications.find(
          (j) => j.patientId === patientId && j.appointmentType === "assessment",
        );
      }
      return absenceJustifications.find(
        (j) =>
          j.patientId === patientId &&
          (j.appointmentType === "physiotherapy" || j.appointmentType === "tens"),
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
        (t) => t.appointmentType === "physiotherapy",
      ).length;
      const tensCount = group.treatments.filter(
        (t) => t.appointmentType === "tens",
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
    return [getAppointmentTypeLabel("assessment")];
  }
  const parts: string[] = [];
  if (card.physiotherapyCount > 0) {
    parts.push(
      `${getAppointmentTypeLabel("physiotherapy")} (${card.physiotherapyCount} ${card.physiotherapyCount === 1 ? "location" : "locations"})`,
    );
  }
  if (card.tensCount > 0) {
    parts.push(
      `${getAppointmentTypeLabel("tens")} (${card.tensCount} ${card.tensCount === 1 ? "location" : "locations"})`,
    );
  }
  return parts;
}

/**
 * Groups appointments with body location counts for treatment types.
 * Each appointment = 1 local. Used in ConfirmationStep for "Physiotherapy - 1 site" format.
 */
export function groupAppointmentsForDisplayWithBodyLocation(
  appointments: IAppointmentStatusDetailWithType[],
): GroupedAppointmentDisplayWithBodyLocation[] {
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

  appointments.forEach((appointment) => {
    const key = appointment.patientId?.toString() || appointment.name;
    const existing = patientGroups.get(key);

    if (existing) {
      if (appointment.appointmentType === "assessment") {
        existing.assessmentCount += 1;
      } else if (appointment.appointmentType === "physiotherapy") {
        existing.physiotherapyCount += 1;
      } else if (appointment.appointmentType === "tens") {
        existing.tensCount += 1;
      }
    } else {
      patientGroups.set(key, {
        patientName: appointment.name,
        patientId: appointment.patientId,
        assessmentCount: appointment.appointmentType === "assessment" ? 1 : 0,
        physiotherapyCount:
          appointment.appointmentType === "physiotherapy" ? 1 : 0,
        tensCount: appointment.appointmentType === "tens" ? 1 : 0,
      });
    }
  });

  const result: GroupedAppointmentDisplayWithBodyLocation[] = [];

  patientGroups.forEach((group) => {
    const hasTreatments = group.physiotherapyCount > 0 || group.tensCount > 0;

    if (group.assessmentCount > 0 && hasTreatments) {
      result.push({
        patientName: group.patientName,
        patientId: group.patientId,
        label: getAppointmentTypeLabel("assessment"),
      });

      const treatmentParts: string[] = [];
      if (group.physiotherapyCount > 0) {
        treatmentParts.push(
          `${getAppointmentTypeLabel("physiotherapy")} - ${group.physiotherapyCount} ${group.physiotherapyCount === 1 ? "location" : "locations"}`,
        );
      }
      if (group.tensCount > 0) {
        treatmentParts.push(
          `${getAppointmentTypeLabel("tens")} - ${group.tensCount} ${group.tensCount === 1 ? "location" : "locations"}`,
        );
      }
      result.push({
        patientName: group.patientName,
        patientId: group.patientId,
        label: treatmentParts.join(" and "),
        physiotherapyCount: group.physiotherapyCount,
        tensCount: group.tensCount,
      });
    } else if (group.assessmentCount > 0) {
      result.push({
        patientName: group.patientName,
        patientId: group.patientId,
        label: getAppointmentTypeLabel("assessment"),
      });
    } else if (hasTreatments) {
      const treatmentParts: string[] = [];
      if (group.physiotherapyCount > 0) {
        treatmentParts.push(
          `${getAppointmentTypeLabel("physiotherapy")} - ${group.physiotherapyCount} ${group.physiotherapyCount === 1 ? "location" : "locations"}`,
        );
      }
      if (group.tensCount > 0) {
        treatmentParts.push(
          `${getAppointmentTypeLabel("tens")} - ${group.tensCount} ${group.tensCount === 1 ? "location" : "locations"}`,
        );
      }
      result.push({
        patientName: group.patientName,
        patientId: group.patientId,
        label: treatmentParts.join(" and "),
        physiotherapyCount: group.physiotherapyCount,
        tensCount: group.tensCount,
      });
    }
  });

  return result;
}
