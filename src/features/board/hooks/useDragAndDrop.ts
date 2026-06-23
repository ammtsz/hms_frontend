import { useState, useCallback } from 'react';
import { useAttendanceBoardState } from '@/features/board/hooks/useAttendanceBoardState';
import type {
  AttendanceProgression,
  AttendanceType,
} from '@/types/types';
import type { IDraggedItem } from '../types';
import {
  buildDragTreatmentTypes,
  findPatientInBoard,
  getPatientsForColumn,
} from '@/features/board/utils/dragDropAttendanceHelpers';
import { useDragDropStatusUpdater } from './useDragDropStatusUpdater';
import { useDragDropDropHandler } from './useDragDropDropHandler';

export const useDragAndDrop = () => {
  const { attendancesByDate, setAttendancesByDate, refreshCurrentDate } =
    useAttendanceBoardState();

  const updateAttendanceStatus = useDragDropStatusUpdater();

  const [dragged, setDragged] = useState<IDraggedItem | null>(null);

  const findPatient = useCallback(
    (
      type: AttendanceType,
      status: AttendanceProgression,
      patientId: number,
    ) => findPatientInBoard(attendancesByDate, type, status, patientId),
    [attendancesByDate],
  );

  const getPatients = useCallback(
    (type: AttendanceType, status: AttendanceProgression) =>
      getPatientsForColumn(attendancesByDate, type, status),
    [attendancesByDate],
  );

  const { handleDropWithConfirm } = useDragDropDropHandler({
    dragged,
    setDragged,
    attendancesByDate,
    setAttendancesByDate,
    refreshCurrentDate,
    updateAttendanceStatus,
  });

  const handleDragStart = useCallback(
    (
      type: AttendanceType,
      idx: number,
      status: AttendanceProgression,
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
        attendancesByDate,
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
    [findPatient, getPatients, attendancesByDate],
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
