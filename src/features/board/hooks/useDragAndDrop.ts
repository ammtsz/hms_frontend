import { useState, useCallback } from 'react';
import { useBoardState } from '@/features/board/hooks/useBoardState';
import type {
  AppointmentProgression,
  AppointmentType,
} from '@/types/types';
import type { IDraggedItem } from '../types';
import {
  buildDragTreatmentTypes,
  findPatientInBoard,
  getPatientsForColumn,
} from '@/features/board/utils/dragDropAppointmentHelpers';
import { useDragDropStatusUpdater } from './useDragDropStatusUpdater';
import { useDragDropDropHandler } from './useDragDropDropHandler';

export const useDragAndDrop = () => {
  const { appointmentsByDate, setAppointmentsByDate, refreshCurrentDate } =
    useBoardState();

  const updateAppointmentStatus = useDragDropStatusUpdater();

  const [dragged, setDragged] = useState<IDraggedItem | null>(null);

  const findPatient = useCallback(
    (
      type: AppointmentType,
      status: AppointmentProgression,
      patientId: number,
    ) => findPatientInBoard(appointmentsByDate, type, status, patientId),
    [appointmentsByDate],
  );

  const getPatients = useCallback(
    (type: AppointmentType, status: AppointmentProgression) =>
      getPatientsForColumn(appointmentsByDate, type, status),
    [appointmentsByDate],
  );

  const { handleDropWithConfirm } = useDragDropDropHandler({
    dragged,
    setDragged,
    appointmentsByDate,
    setAppointmentsByDate,
    refreshCurrentDate,
    updateAppointmentStatus,
  });

  const handleDragStart = useCallback(
    (
      type: AppointmentType,
      idx: number,
      status: AppointmentProgression,
      patientId?: number,
    ) => {
      if (status === 'completed') {
        return;
      }

      let patient;

      if (patientId) {
        patient = findPatient(type, status, patientId);
      } else {
        const patients = getPatients(type, status);
        patient = patients[idx];
      }

      if (!patient?.patientId) {
        console.error(
          'Patient not found at index',
          idx,
          'or patientId',
          patientId,
          'or patient missing patientId',
        );
        return;
      }

      const { isCombinedTreatment, treatmentTypes } = buildDragTreatmentTypes(
        type,
        status,
        patient.patientId,
        appointmentsByDate,
      );

      setDragged({
        type,
        status,
        idx,
        patientId: patient.patientId,
        isCombinedTreatment,
        treatmentTypes,
      });
    },
    [findPatient, getPatients, appointmentsByDate],
  );

  const handleDragEnd = useCallback(() => {
    setDragged(null);
  }, []);

  return {
    dragged,
    handleDragStart,
    handleDragEnd,
    handleDropWithConfirm,
    getPatients,
  };
};

export default useDragAndDrop;
