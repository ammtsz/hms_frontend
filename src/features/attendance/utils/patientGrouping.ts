import type { AttendanceStatusDetail, AttendanceType } from "@/types/types";

// Extended interface to include combined treatment information
export interface IGroupedPatient extends AttendanceStatusDetail {
  originalType: AttendanceType;
  treatmentTypes: AttendanceType[];
  combinedType: 'physiotherapy' | 'tens' | 'combined';
  attendanceIds: number[]; // Track all attendance IDs for this patient
}

// Define color mappings for treatment combinations
export const getTreatmentCombinationColor = (treatmentTypes: AttendanceType[]): 'physiotherapy' | 'tens' | 'combined' => {
  const hasPhysiotherapy = treatmentTypes.includes('physiotherapy');
  const hasTens = treatmentTypes.includes('tens');

  if (hasPhysiotherapy && hasTens) {
    return 'combined'; // Green color for both treatments
  } else if (hasPhysiotherapy) {
    return 'physiotherapy'; // Yellow color for physiotherapy only
  } else if (hasTens) {
    return 'tens'; // Blue color for tens only
  }

  // Fallback - shouldn't happen in physiotherapy + tens section
  return 'physiotherapy';
};

const groupPatientsByTreatmentsAndStatus = (
  patients: AttendanceStatusDetail[],
  patientMap: Map<string | number, IGroupedPatient>,
  treatmentType: "physiotherapy" | "tens"
): Map<string | number, IGroupedPatient> => {
  patients.forEach(patient => {
    const key = `${patient.patientId}${patient.isCancelled ? "-cancelled" : patient.isMissed ? "-missed" : ""}`;

    if (patient.patientId) {
      const existingPatient = patientMap.get(key);
      if (existingPatient) {
        // Patient already exists, add physiotherapy to their treatment types
        existingPatient.treatmentTypes.push(treatmentType);
        existingPatient.combinedType = getTreatmentCombinationColor(existingPatient.treatmentTypes);
        // Add this attendance ID to the list
        if (patient.attendanceId && !existingPatient.attendanceIds.includes(patient.attendanceId)) {
          existingPatient.attendanceIds.push(patient.attendanceId);
        }
      } else {
        // New patient, create entry
        patientMap.set(key, {
          ...patient,
          originalType: treatmentType,
          treatmentTypes: [treatmentType],
          combinedType: treatmentType,
          attendanceIds: patient.attendanceId ? [patient.attendanceId] : []
        });
      }
    }
  });
  return patientMap;
}

// Group patients by patientId for the same day, combining their treatments
export const groupPatientsByTreatments = (
  physiotherapyPatients: AttendanceStatusDetail[],
  tensPatients: AttendanceStatusDetail[]
): IGroupedPatient[] => {
  const patientMap = new Map<string | number, IGroupedPatient>();

  groupPatientsByTreatmentsAndStatus(physiotherapyPatients, patientMap, "physiotherapy");
  groupPatientsByTreatmentsAndStatus(tensPatients, patientMap, "tens");

  return Array.from(patientMap.values());
};

/** Count physiotherapy / tens attendances on a single grouped card. */
export interface TreatmentTypeCounts {
  physiotherapy: number;
  tens: number;
}

export const countTreatmentTypes = (
  treatmentTypes: AttendanceType[],
): TreatmentTypeCounts => {
  const counts: TreatmentTypeCounts = { physiotherapy: 0, tens: 0 };
  for (const treatmentType of treatmentTypes) {
    if (treatmentType === "physiotherapy") counts.physiotherapy += 1;
    else if (treatmentType === "tens") counts.tens += 1;
  }
  return counts;
};
