import type { AppointmentStatusDetail, AppointmentType } from "@/types/types";

// Extended interface to include combined treatment information
export interface IGroupedPatient extends AppointmentStatusDetail {
  originalType: AppointmentType;
  treatmentTypes: AppointmentType[];
  combinedType: 'physiotherapy' | 'tens' | 'combined';
  appointmentIds: number[]; // Track all appointment IDs for this patient
}

/** Maps treatment types on a grouped card to its legend/color scheme (physiotherapy, tens, or combined). */
export const getTreatmentCombinationColor = (treatmentTypes: AppointmentType[]): 'physiotherapy' | 'tens' | 'combined' => {
  const hasPhysiotherapy = treatmentTypes.includes('physiotherapy');
  const hasTens = treatmentTypes.includes('tens');

  if (hasPhysiotherapy && hasTens) {
    return 'combined';
  } else if (hasPhysiotherapy) {
    return 'physiotherapy';
  } else if (hasTens) {
    return 'tens';
  }

  // Fallback - shouldn't happen in physiotherapy + tens section
  return 'physiotherapy';
};

const groupPatientsByTreatmentsAndStatus = (
  patients: AppointmentStatusDetail[],
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
        // Add this appointment ID to the list
        if (patient.appointmentId && !existingPatient.appointmentIds.includes(patient.appointmentId)) {
          existingPatient.appointmentIds.push(patient.appointmentId);
        }
      } else {
        // New patient, create entry
        patientMap.set(key, {
          ...patient,
          originalType: treatmentType,
          treatmentTypes: [treatmentType],
          combinedType: treatmentType,
          appointmentIds: patient.appointmentId ? [patient.appointmentId] : []
        });
      }
    }
  });
  return patientMap;
}

// Group patients by patientId for the same day, combining their treatments
export const groupPatientsByTreatments = (
  physiotherapyPatients: AppointmentStatusDetail[],
  tensPatients: AppointmentStatusDetail[]
): IGroupedPatient[] => {
  const patientMap = new Map<string | number, IGroupedPatient>();

  groupPatientsByTreatmentsAndStatus(physiotherapyPatients, patientMap, "physiotherapy");
  groupPatientsByTreatmentsAndStatus(tensPatients, patientMap, "tens");

  return Array.from(patientMap.values());
};

/** Count physiotherapy / tens appointments on a single grouped card. */
export interface TreatmentTypeCounts {
  physiotherapy: number;
  tens: number;
}

export const countTreatmentTypes = (
  treatmentTypes: AppointmentType[],
): TreatmentTypeCounts => {
  const counts: TreatmentTypeCounts = { physiotherapy: 0, tens: 0 };
  for (const treatmentType of treatmentTypes) {
    if (treatmentType === "physiotherapy") counts.physiotherapy += 1;
    else if (treatmentType === "tens") counts.tens += 1;
  }
  return counts;
};
