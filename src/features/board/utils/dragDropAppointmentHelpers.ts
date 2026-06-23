import { sortPatientsByPriority } from '@/utils/businessRules';
import type {
  AppointmentByDate,
  AppointmentProgression,
  AppointmentStatusDetail,
  AppointmentType,
} from '@/types/types';

export function findAllPatientAppointments(
  appointmentsByDate: AppointmentByDate | null,
  type: AppointmentType,
  status: AppointmentProgression,
  patientId: number,
): number[] {
  const statusAppointments =
    appointmentsByDate?.[type] && status in appointmentsByDate[type]
      ? (appointmentsByDate[type][
          status as keyof (typeof appointmentsByDate)[typeof type]
        ] as AppointmentStatusDetail[])
      : [];
  return (
    statusAppointments
      ?.filter((p) => p.patientId === patientId)
      ?.map((p) => p.appointmentId as number) || []
  );
}

export function findPatientInBoard(
  appointmentsByDate: AppointmentByDate | null,
  type: AppointmentType,
  status: AppointmentProgression,
  patientId: number,
): AppointmentStatusDetail | undefined {
  const patient = appointmentsByDate?.[type]?.[status]?.find(
    (p) => p.patientId === patientId,
  );
  if (!patient) return undefined;
  return {
    ...patient,
    treatmentAppointmentIds: findAllPatientAppointments(
      appointmentsByDate,
      type,
      status,
      patientId,
    ),
  };
}

export function getPatientsForColumn(
  appointmentsByDate: AppointmentByDate | null,
  type: AppointmentType,
  status: AppointmentProgression,
): AppointmentStatusDetail[] {
  if (!appointmentsByDate) return [];

  const patients =
    appointmentsByDate[type][
      status as keyof (typeof appointmentsByDate)[typeof type]
    ] || [];

  if (status === 'checkedIn') {
    return sortPatientsByPriority(patients) as AppointmentStatusDetail[];
  }

  return patients;
}

export function updatePatientTimestamps(
  patient: AppointmentStatusDetail,
  status: AppointmentProgression,
): AppointmentStatusDetail {
  const updates: Partial<AppointmentStatusDetail> = {};
  if (status === 'checkedIn') {
    updates.checkedInTime = new Date().toTimeString().split(' ')[0];
  }
  if (status === 'onGoing') {
    updates.onGoingTime = new Date().toTimeString().split(' ')[0];
  }
  if (status === 'completed') {
    updates.completedTime = new Date().toTimeString().split(' ')[0];
  }
  return { ...patient, ...updates };
}

export function buildDragTreatmentTypes(
  type: AppointmentType,
  status: AppointmentProgression,
  patientId: number,
  appointmentsByDate: AppointmentByDate | null,
): { isCombinedTreatment: boolean; treatmentTypes: AppointmentType[] } {
  const physiotherapyPatient = findPatientInBoard(
    appointmentsByDate,
    'physiotherapy',
    status,
    patientId,
  );
  const tensPatient = findPatientInBoard(
    appointmentsByDate,
    'tens',
    status,
    patientId,
  );
  const isCombinedTreatment = !!(physiotherapyPatient && tensPatient);

  let treatmentTypes: AppointmentType[] = [type];
  if (isCombinedTreatment) {
    treatmentTypes = ['physiotherapy', 'tens'];
    if (type !== 'physiotherapy' && type !== 'tens') {
      treatmentTypes.unshift(type);
    }
  }
  if (physiotherapyPatient?.treatmentAppointmentIds?.length) {
    for (let i = 1; i < physiotherapyPatient.treatmentAppointmentIds.length; i++) {
      treatmentTypes.push('physiotherapy');
    }
  }
  if (tensPatient?.treatmentAppointmentIds?.length) {
    for (let i = 1; i < tensPatient.treatmentAppointmentIds.length; i++) {
      treatmentTypes.push('tens');
    }
  }

  return { isCombinedTreatment, treatmentTypes };
}
