import { sortPatientsByPriority } from '@/utils/businessRules';
import type {
  AttendanceByDate,
  AttendanceProgression,
  AttendanceStatusDetail,
  AttendanceType,
} from '@/types/types';

export function findAllPatientAttendances(
  attendancesByDate: AttendanceByDate | null,
  type: AttendanceType,
  status: AttendanceProgression,
  patientId: number,
): number[] {
  const statusAttendances =
    attendancesByDate?.[type] && status in attendancesByDate[type]
      ? (attendancesByDate[type][
          status as keyof (typeof attendancesByDate)[typeof type]
        ] as AttendanceStatusDetail[])
      : [];
  return (
    statusAttendances
      ?.filter((p) => p.patientId === patientId)
      ?.map((p) => p.attendanceId as number) || []
  );
}

export function findPatientInBoard(
  attendancesByDate: AttendanceByDate | null,
  type: AttendanceType,
  status: AttendanceProgression,
  patientId: number,
): AttendanceStatusDetail | undefined {
  const patient = attendancesByDate?.[type]?.[status]?.find(
    (p) => p.patientId === patientId,
  );
  if (!patient) return undefined;
  return {
    ...patient,
    treatmentAttendanceIds: findAllPatientAttendances(
      attendancesByDate,
      type,
      status,
      patientId,
    ),
  };
}

export function getPatientsForColumn(
  attendancesByDate: AttendanceByDate | null,
  type: AttendanceType,
  status: AttendanceProgression,
): AttendanceStatusDetail[] {
  if (!attendancesByDate) return [];

  const patients =
    attendancesByDate[type][
      status as keyof (typeof attendancesByDate)[typeof type]
    ] || [];

  if (status === 'checkedIn') {
    return sortPatientsByPriority(patients) as AttendanceStatusDetail[];
  }

  return patients;
}

export function updatePatientTimestamps(
  patient: AttendanceStatusDetail,
  status: AttendanceProgression,
): AttendanceStatusDetail {
  const updates: Partial<AttendanceStatusDetail> = {};
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
  type: AttendanceType,
  status: AttendanceProgression,
  patientId: number,
  attendancesByDate: AttendanceByDate | null,
): { isCombinedTreatment: boolean; treatmentTypes: AttendanceType[] } {
  const physiotherapyPatient = findPatientInBoard(
    attendancesByDate,
    'physiotherapy',
    status,
    patientId,
  );
  const tensPatient = findPatientInBoard(
    attendancesByDate,
    'tens',
    status,
    patientId,
  );
  const isCombinedTreatment = !!(physiotherapyPatient && tensPatient);

  let treatmentTypes: AttendanceType[] = [type];
  if (isCombinedTreatment) {
    treatmentTypes = ['physiotherapy', 'tens'];
    if (type !== 'physiotherapy' && type !== 'tens') {
      treatmentTypes.unshift(type);
    }
  }
  if (physiotherapyPatient?.treatmentAttendanceIds?.length) {
    for (let i = 1; i < physiotherapyPatient.treatmentAttendanceIds.length; i++) {
      treatmentTypes.push('physiotherapy');
    }
  }
  if (tensPatient?.treatmentAttendanceIds?.length) {
    for (let i = 1; i < tensPatient.treatmentAttendanceIds.length; i++) {
      treatmentTypes.push('tens');
    }
  }

  return { isCombinedTreatment, treatmentTypes };
}
