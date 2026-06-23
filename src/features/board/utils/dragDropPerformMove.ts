import type {
  AppointmentByDate,
  AppointmentProgression,
  AppointmentStatusDetail,
  AppointmentType,
} from '@/types/types';
import type { IDraggedItem } from '../types';
import { resolveTreatmentTypesToMove } from './dragDropRules';
import {
  findPatientInBoard,
  updatePatientTimestamps,
} from './dragDropAppointmentHelpers';
import type { UpdateAppointmentStatusFn } from '../hooks/useDragDropStatusUpdater';

export interface PerformAppointmentMoveParams {
  dragged: IDraggedItem;
  toType: AppointmentType;
  toStatus: AppointmentProgression;
  appointmentsByDate: AppointmentByDate;
  setAppointmentsByDate: (data: AppointmentByDate | null) => void;
  updateAppointmentStatus: UpdateAppointmentStatusFn;
}

export async function performAppointmentMove({
  dragged,
  toType,
  toStatus,
  appointmentsByDate,
  setAppointmentsByDate,
  updateAppointmentStatus,
}: PerformAppointmentMoveParams): Promise<void> {
  const treatmentTypesToMove = resolveTreatmentTypesToMove(dragged, toType);

  let newAppointmentsByDate = { ...appointmentsByDate };

  for (const treatmentType of treatmentTypesToMove) {
    const patient = findPatientInBoard(
      appointmentsByDate,
      treatmentType as AppointmentType,
      dragged.status,
      dragged.patientId,
    );
    if (!patient) continue;

    const appointmentIds =
      patient.treatmentAppointmentIds && patient.treatmentAppointmentIds.length > 0
        ? patient.treatmentAppointmentIds
        : patient.appointmentId
          ? [patient.appointmentId]
          : [];

    if (appointmentIds.length > 0) {
      for (const appointmentId of appointmentIds) {
        const result = await updateAppointmentStatus(appointmentId, toStatus);
        if (!result.success) {
          console.warn(
            `Backend sync failed for ${treatmentType} appointmentId ${appointmentId}, continuing with local update`,
          );
        }
      }
    }

    const sourceType = treatmentType as AppointmentType;
    newAppointmentsByDate = {
      ...newAppointmentsByDate,
      [sourceType]: {
        ...newAppointmentsByDate[sourceType],
        [dragged.status]: (
          newAppointmentsByDate[sourceType][dragged.status] as AppointmentStatusDetail[]
        ).filter((p: AppointmentStatusDetail) => p.patientId !== dragged.patientId),
      },
    };

    const destinationType = dragged.isCombinedTreatment
      ? (treatmentType as AppointmentType)
      : toType;

    newAppointmentsByDate = {
      ...newAppointmentsByDate,
      [destinationType]: {
        ...newAppointmentsByDate[destinationType],
        [toStatus]: [
          ...(newAppointmentsByDate[destinationType][toStatus] as AppointmentStatusDetail[]),
          updatePatientTimestamps(patient, toStatus),
        ],
      },
    };
  }

  setAppointmentsByDate(newAppointmentsByDate);
}
