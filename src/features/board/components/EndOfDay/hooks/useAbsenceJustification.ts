import { useState, useMemo } from "react";
import type { AbsenceJustification, ScheduledAbsence } from "../types";
import type { AppointmentType } from "@/types/types";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";

export interface GroupedAbsence {
  patientId: number;
  patientName: string;
  assessment: ScheduledAbsence[];
  treatments: ScheduledAbsence[]; // physiotherapy + tens
}

interface UseAbsenceJustificationProps {
  scheduledAbsences: ScheduledAbsence[];
  absenceJustifications: AbsenceJustification[];
  onJustificationChange: (
    patientId: number,
    appointmentType: AppointmentType,
    justified: boolean,
    justification?: string,
  ) => void;
}

export const useAbsenceJustification = ({
  scheduledAbsences,
  absenceJustifications,
  onJustificationChange,
}: UseAbsenceJustificationProps) => {
  const [applyToAllByPatient, setApplyToAllByPatient] = useState<
    Record<number, boolean>
  >({});

  // Group absences by patient
  const groupedAbsences = useMemo(() => {
    const grouped: Record<number, GroupedAbsence> = {};

    scheduledAbsences.forEach((absence) => {
      if (!grouped[absence.patientId]) {
        grouped[absence.patientId] = {
          patientId: absence.patientId,
          patientName: absence.patientName,
          assessment: [],
          treatments: [],
        };
      }

      if (absence.appointmentType === "assessment") {
        grouped[absence.patientId].assessment.push(absence);
      } else {
        grouped[absence.patientId].treatments.push(absence);
      }
    });

    return Object.values(grouped);
  }, [scheduledAbsences]);

  const getApplyToAll = (patientId: number) => {
    return applyToAllByPatient[patientId] !== false; // Default to true
  };

  const toggleApplyToAll = (patientId: number) => {
    setApplyToAllByPatient((prev) => ({
      ...prev,
      [patientId]: !getApplyToAll(patientId),
    }));
  };

  const handleJustificationChange = (
    patientId: number,
    appointmentType: AppointmentType | "all" | "treatments",
    justified: boolean,
    justification?: string,
  ) => {
    const group = groupedAbsences.find((g) => g.patientId === patientId);
    if (!group) return;

    if (appointmentType === "all") {
      [...group.assessment, ...group.treatments].forEach((absence) => {
        onJustificationChange(
          patientId,
          absence.appointmentType as AppointmentType,
          justified,
          justification,
        );
      });
    } else if (appointmentType === "treatments") {
      group.treatments.forEach((absence) => {
        onJustificationChange(
          patientId,
          absence.appointmentType as AppointmentType,
          justified,
          justification,
        );
      });
    } else {
      onJustificationChange(patientId, appointmentType, justified, justification);
    }
  };

  const getJustificationForType = (
    patientId: number,
    appointmentType: "assessment" | "treatments" | "all",
  ) => {
    if (appointmentType === "all") {
      return absenceJustifications.find((j) => j.patientId === patientId);
    } else if (appointmentType === "assessment") {
      return absenceJustifications.find(
        (j) => j.patientId === patientId && j.appointmentType === "assessment",
      );
    } else {
      return absenceJustifications.find(
        (j) =>
          j.patientId === patientId &&
          (j.appointmentType === "physiotherapy" || j.appointmentType === "tens"),
      );
    }
  };

  const formatAbsencesList = (group: GroupedAbsence) => {
    const parts: string[] = [];

    if (group.assessment.length > 0) {
      parts.push(getAppointmentTypeLabel("assessment"));
    }

    if (group.treatments.length > 0) {
      const physiotherapy = group.treatments.filter(
        (t) => t.appointmentType === "physiotherapy",
      );
      const tens = group.treatments.filter((t) => t.appointmentType === "tens");

      const treatmentParts: string[] = [];
      if (physiotherapy.length > 0) {
        treatmentParts.push(getAppointmentTypeLabel("physiotherapy"));
      }
      if (tens.length > 0) {
        treatmentParts.push(getAppointmentTypeLabel("tens"));
      }

      if (treatmentParts.length > 0) {
        parts.push(treatmentParts.join(" and "));
      }
    }

    return parts.join(", ");
  };

  const allJustified = absenceJustifications.every(
    (j) => j.justified === true || j.justified === false,
  );

  return {
    groupedAbsences,
    getApplyToAll,
    toggleApplyToAll,
    handleJustificationChange,
    getJustificationForType,
    formatAbsencesList,
    allJustified,
  };
};
