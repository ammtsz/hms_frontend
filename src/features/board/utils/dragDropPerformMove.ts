import type {
  AttendanceByDate,
  AttendanceProgression,
  AttendanceStatusDetail,
  AttendanceType,
} from '@/types/types';
import type { IDraggedItem } from '../types';
import { resolveTreatmentTypesToMove } from './dragDropRules';
import {
  findPatientInBoard,
  updatePatientTimestamps,
} from './dragDropAttendanceHelpers';
import type { UpdateAttendanceStatusFn } from '../hooks/useDragDropStatusUpdater';

export interface PerformAttendanceMoveParams {
  dragged: IDraggedItem;
  toType: AttendanceType;
  toStatus: AttendanceProgression;
  attendancesByDate: AttendanceByDate;
  setAttendancesByDate: (data: AttendanceByDate | null) => void;
  updateAttendanceStatus: UpdateAttendanceStatusFn;
}

export async function performAttendanceMove({
  dragged,
  toType,
  toStatus,
  attendancesByDate,
  setAttendancesByDate,
  updateAttendanceStatus,
}: PerformAttendanceMoveParams): Promise<void> {
  const treatmentTypesToMove = resolveTreatmentTypesToMove(dragged, toType);

  let newAttendancesByDate = { ...attendancesByDate };

  for (const treatmentType of treatmentTypesToMove) {
    const patient = findPatientInBoard(
      attendancesByDate,
      treatmentType as AttendanceType,
      dragged.status,
      dragged.patientId,
    );
    if (!patient) continue;

    const attendanceIds =
      patient.treatmentAttendanceIds && patient.treatmentAttendanceIds.length > 0
        ? patient.treatmentAttendanceIds
        : patient.attendanceId
          ? [patient.attendanceId]
          : [];

    if (attendanceIds.length > 0) {
      for (const attendanceId of attendanceIds) {
        const result = await updateAttendanceStatus(attendanceId, toStatus);
        if (!result.success) {
          console.warn(
            `Backend sync failed for ${treatmentType} attendanceId ${attendanceId}, continuing with local update`,
          );
        }
      }
    }

    const sourceType = treatmentType as AttendanceType;
    newAttendancesByDate = {
      ...newAttendancesByDate,
      [sourceType]: {
        ...newAttendancesByDate[sourceType],
        [dragged.status]: (
          newAttendancesByDate[sourceType][dragged.status] as AttendanceStatusDetail[]
        ).filter((p: AttendanceStatusDetail) => p.patientId !== dragged.patientId),
      },
    };

    const destinationType = dragged.isCombinedTreatment
      ? (treatmentType as AttendanceType)
      : toType;

    newAttendancesByDate = {
      ...newAttendancesByDate,
      [destinationType]: {
        ...newAttendancesByDate[destinationType],
        [toStatus]: [
          ...(newAttendancesByDate[destinationType][toStatus] as AttendanceStatusDetail[]),
          updatePatientTimestamps(patient, toStatus),
        ],
      },
    };
  }

  setAttendancesByDate(newAttendancesByDate);
}
