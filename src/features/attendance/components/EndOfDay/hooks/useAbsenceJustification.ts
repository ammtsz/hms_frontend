import { useState, useMemo } from "react";
import type { AbsenceJustification, ScheduledAbsence } from "../types";
import type { AttendanceType } from "@/types/types";

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
    attendanceType: AttendanceType,
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

      if (absence.attendanceType === "assessment") {
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
    attendanceType: AttendanceType | "all" | "treatments",
    justified: boolean,
    justification?: string,
  ) => {
    const group = groupedAbsences.find((g) => g.patientId === patientId);
    if (!group) return;

    if (attendanceType === "all") {
      [...group.assessment, ...group.treatments].forEach((absence) => {
        onJustificationChange(
          patientId,
          absence.attendanceType as AttendanceType,
          justified,
          justification,
        );
      });
    } else if (attendanceType === "treatments") {
      group.treatments.forEach((absence) => {
        onJustificationChange(
          patientId,
          absence.attendanceType as AttendanceType,
          justified,
          justification,
        );
      });
    } else {
      onJustificationChange(patientId, attendanceType, justified, justification);
    }
  };

  const getJustificationForType = (
    patientId: number,
    attendanceType: "assessment" | "treatments" | "all",
  ) => {
    if (attendanceType === "all") {
      return absenceJustifications.find((j) => j.patientId === patientId);
    } else if (attendanceType === "assessment") {
      return absenceJustifications.find(
        (j) => j.patientId === patientId && j.attendanceType === "assessment",
      );
    } else {
      return absenceJustifications.find(
        (j) =>
          j.patientId === patientId &&
          (j.attendanceType === "physiotherapy" || j.attendanceType === "tens"),
      );
    }
  };

  const formatAbsencesList = (group: GroupedAbsence) => {
    const parts: string[] = [];

    if (group.assessment.length > 0) {
      parts.push("Consulta de Avaliação");
    }

    if (group.treatments.length > 0) {
      const physiotherapy = group.treatments.filter(
        (t) => t.attendanceType === "physiotherapy",
      );
      const tens = group.treatments.filter((t) => t.attendanceType === "tens");

      const treatmentParts: string[] = [];
      if (physiotherapy.length > 0) {
        treatmentParts.push("Fisioterapia");
      }
      if (tens.length > 0) {
        treatmentParts.push("TENS");
      }

      if (treatmentParts.length > 0) {
        parts.push(treatmentParts.join(" e "));
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
