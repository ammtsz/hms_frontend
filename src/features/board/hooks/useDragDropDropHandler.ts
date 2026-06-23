import { useCallback } from 'react';
import { usePatients, useUpdatePatient } from '@/api/query/hooks/usePatientQueries';
import { PatientStatus } from '@/api/types';
import { isNewPatientCheckInDataComplete } from '@/features/board/components/WalkIn/utils/newPatientCheckInValidation';
import type {
  AttendanceProgression,
  AttendanceType,
  AttendanceByDate,
  AttendanceStatusDetail,
} from '@/types/types';
import type { IDraggedItem } from '../types';
import { isAllowedDropTarget, isValidMove } from '@/features/board/utils/dragDropRules';
import {
  findPatientInBoard,
  updatePatientTimestamps,
} from '@/features/board/utils/dragDropAttendanceHelpers';
import { performAttendanceMove } from '@/features/board/utils/dragDropPerformMove';
import type { UpdateAttendanceStatusFn } from './useDragDropStatusUpdater';
import {
  useOpenMultiSection,
  useOpenNewPatientCheckIn,
  useOpenPostAttendance,
  useOpenPostTreatment,
  useOpenAssessmentBeforeTreatmentConfirm,
} from '@/stores/modalStore';
import { useToast } from '@/contexts/ToastContext';

export interface UseDragDropDropHandlerParams {
  dragged: IDraggedItem | null;
  setDragged: (item: IDraggedItem | null) => void;
  attendancesByDate: AttendanceByDate | null;
  setAttendancesByDate: (data: AttendanceByDate | null) => void;
  refreshCurrentDate: () => Promise<void>;
  updateAttendanceStatus: UpdateAttendanceStatusFn;
}

export function useDragDropDropHandler({
  dragged,
  setDragged,
  attendancesByDate,
  setAttendancesByDate,
  refreshCurrentDate,
  updateAttendanceStatus,
}: UseDragDropDropHandlerParams) {
  const { data: patients = [] } = usePatients();
  const updatePatientMutation = useUpdatePatient();

  const openPostAttendance = useOpenPostAttendance();
  const openPostTreatment = useOpenPostTreatment();
  const openNewPatientCheckIn = useOpenNewPatientCheckIn();
  const openMultiSection = useOpenMultiSection();
  const openAssessmentBeforeTreatmentConfirm =
    useOpenAssessmentBeforeTreatmentConfirm();
  const { showToast } = useToast();

  const findPatient = useCallback(
    (
      type: AttendanceType,
      status: AttendanceProgression,
      patientId: number,
    ): AttendanceStatusDetail | undefined =>
      findPatientInBoard(attendancesByDate, type, status, patientId),
    [attendancesByDate],
  );

  const performMove = useCallback(
    async (toType: AttendanceType, toStatus: AttendanceProgression) => {
      if (!dragged || !attendancesByDate || !setAttendancesByDate) return;
      await performAttendanceMove({
        dragged,
        toType,
        toStatus,
        attendancesByDate,
        setAttendancesByDate,
        updateAttendanceStatus,
      });
    },
    [dragged, attendancesByDate, setAttendancesByDate, updateAttendanceStatus],
  );

  const handleDropWithConfirm = useCallback(
    async (toType: AttendanceType, toStatus: AttendanceProgression) => {
      if (!dragged || !attendancesByDate) return;

      const patient = findPatient(dragged.type, dragged.status, dragged.patientId);
      if (!patient) return;

      if (!isAllowedDropTarget(dragged, toType)) {
        setDragged(null);
        return;
      }

      const handleBlockDuplicateOnGoingFlow = (): boolean => {
        if (toStatus !== 'onGoing') return false;
        const patientId = dragged.patientId;
        if (dragged.type === 'assessment') {
          const inPhysiotherapy = findPatient('physiotherapy', 'onGoing', patientId);
          const inTens = findPatient('tens', 'onGoing', patientId);
          if (inPhysiotherapy || inTens) {
            showToast(
              'Patient is already in attendance in another section.',
              'warning',
            );
            setDragged(null);
            return true;
          }
        } else {
          const inAssessment = findPatient('assessment', 'onGoing', patientId);
          if (inAssessment) {
            showToast(
              'Patient is already in attendance in another section.',
              'warning',
            );
            setDragged(null);
            return true;
          }
        }
        return false;
      };

      if (handleBlockDuplicateOnGoingFlow()) return;

      const handleAssessmentBeforeTreatmentFlow = (): boolean => {
        if (dragged.type !== 'assessment' || toStatus !== 'onGoing') return false;
        const patientId = dragged.patientId;
        const statusesToCheck: AttendanceProgression[] = [
          'scheduled',
          'checkedIn',
          'onGoing',
        ];
        const hasIncompletePhysiotherapy = statusesToCheck.some((s) =>
          findPatient('physiotherapy', s, patientId),
        );
        const hasIncompleteTens = statusesToCheck.some((s) =>
          findPatient('tens', s, patientId),
        );
        if (!hasIncompletePhysiotherapy && !hasIncompleteTens) return false;

        openAssessmentBeforeTreatmentConfirm(
          async () => {
            await performMove(toType, toStatus);
            setDragged(null);
          },
          () => {
            setDragged(null);
          },
        );
        setDragged(null);
        return true;
      };

      const handleNewPatientCheckInFlow = async (): Promise<boolean> => {
        if (toStatus !== 'checkedIn' || dragged.status !== 'scheduled') return false;
        const patientData = patients.find(
          (p) => String(p.id) === String(patient.patientId),
        );
        if (patientData?.status !== 'N') return false;

        if (isNewPatientCheckInDataComplete(patientData)) {
          try {
            await updatePatientMutation.mutateAsync({
              patientId: patientData.id,
              data: { patientStatus: PatientStatus.IN_TREATMENT },
            });
            await performMove(toType, toStatus);
            await refreshCurrentDate();
          } catch {
            openNewPatientCheckIn({
              attendanceId: patient.attendanceId,
              patient: patientData,
              onComplete: () => {},
            });
          }
          setDragged(null);
          return true;
        }

        openNewPatientCheckIn({
          attendanceId: patient.attendanceId,
          patient: patientData,
          onComplete: () => {},
        });
        setDragged(null);
        return true;
      };

      const handleCompletionFlow = (): boolean => {
        if (toStatus !== 'completed') return false;
        const completionPatient = findPatient(
          dragged.type,
          dragged.status,
          dragged.patientId,
        );
        if (!completionPatient?.attendanceId || !completionPatient?.patientId) {
          return false;
        }

        const attendanceType = dragged.type;
        const fullPatient = patients.find((p) => p.name === completionPatient.name);
        const isFirstAttendance = fullPatient?.status === 'N';

        if (attendanceType === 'assessment') {
          openPostAttendance({
            attendanceId: completionPatient.attendanceId,
            patientId: completionPatient.patientId,
            patientName: completionPatient.name,
            attendanceType,
            currentTreatmentStatus: 'T',
            currentStartDate: undefined,
            currentReturnWeeks: undefined,
            isFirstAttendance,
            onComplete: async () => {
              await performMove(attendanceType, 'completed');
            },
          });
        }

        if (attendanceType !== 'assessment') {
          let attendanceIds: number[];
          if (
            dragged.isCombinedTreatment &&
            (attendanceType === 'physiotherapy' || attendanceType === 'tens')
          ) {
            const physiotherapyPatient = findPatient(
              'physiotherapy',
              dragged.status,
              dragged.patientId,
            );
            const tensPatient = findPatient('tens', dragged.status, dragged.patientId);
            const physiotherapyIds =
              physiotherapyPatient?.treatmentAttendanceIds ??
              (physiotherapyPatient?.attendanceId
                ? [physiotherapyPatient.attendanceId]
                : []);
            const tensIds =
              tensPatient?.treatmentAttendanceIds ??
              (tensPatient?.attendanceId ? [tensPatient.attendanceId] : []);
            attendanceIds = [...physiotherapyIds, ...tensIds];
          } else {
            const ids = completionPatient.treatmentAttendanceIds;
            attendanceIds =
              ids != null && ids.length > 0
                ? ids
                : completionPatient.attendanceId != null
                  ? [completionPatient.attendanceId]
                  : [];
          }
          if (attendanceIds.length > 0) {
            openPostTreatment({
              attendanceIds,
              patientId: completionPatient.patientId,
              patientName: completionPatient.name,
              attendanceType,
              onComplete: async (completedAttendanceIds) => {
                if (completedAttendanceIds.length > 0) {
                  await refreshCurrentDate();
                }
              },
            });
          }
        }

        setDragged(null);
        return true;
      };

      const handleMultiSectionFlow = (): boolean => {
        const assessmentPatient = findPatient(
          'assessment',
          'scheduled',
          dragged.patientId,
        );
        const physiotherapyPatient = findPatient(
          'physiotherapy',
          'scheduled',
          dragged.patientId,
        );
        const isInBothTypes = !!assessmentPatient && !!physiotherapyPatient;
        if (
          !isInBothTypes ||
          dragged.status !== 'scheduled' ||
          toStatus !== 'checkedIn'
        ) {
          return false;
        }

        const currentPending = {
          patientId: dragged.patientId,
          fromStatus: dragged.status,
          toStatus,
          draggedType: dragged.type,
        };

        openMultiSection(
          async () => {
            if (!attendancesByDate || !setAttendancesByDate) return;

            const syncPromises: Promise<{ success: boolean }>[] = [];
            (['assessment', 'physiotherapy', 'tens'] as AttendanceType[]).forEach(
              (type) => {
                const patientForType = findPatient(
                  type,
                  'scheduled',
                  currentPending.patientId,
                );
                if (patientForType) {
                  const ids = patientForType.treatmentAttendanceIds;
                  const attendanceIds: number[] =
                    ids != null && ids.length > 0
                      ? ids
                      : patientForType.attendanceId != null
                        ? [patientForType.attendanceId]
                        : [];
                  attendanceIds.forEach((attendanceId) => {
                    syncPromises.push(
                      updateAttendanceStatus(attendanceId, 'checkedIn')
                        .then((result) => ({ success: result.success }))
                        .catch(() => ({ success: false })),
                    );
                  });
                }
              },
            );

            if (syncPromises.length > 0) {
              try {
                await Promise.all(syncPromises);
              } catch {
                console.warn(
                  'Some backend syncs failed, continuing with local update',
                );
              }
            }

            let newAttendancesByDate = { ...attendancesByDate };
            (['assessment', 'physiotherapy', 'tens'] as AttendanceType[]).forEach(
              (type) => {
                const patientToMove = findPatient(
                  type,
                  'scheduled',
                  currentPending.patientId,
                );
                if (patientToMove) {
                  newAttendancesByDate = {
                    ...newAttendancesByDate,
                    [type]: {
                      ...newAttendancesByDate[type],
                      scheduled: newAttendancesByDate[type].scheduled.filter(
                        (p) => p.patientId !== currentPending.patientId,
                      ),
                      checkedIn: [
                        ...newAttendancesByDate[type].checkedIn,
                        updatePatientTimestamps(patientToMove, 'checkedIn'),
                      ],
                    },
                  };
                }
              },
            );

            setAttendancesByDate(newAttendancesByDate);
            setDragged(null);
          },
          async () => {
            const isCombined = !!(
              findPatient(
                'physiotherapy',
                currentPending.fromStatus,
                currentPending.patientId,
              ) &&
              findPatient(
                'tens',
                currentPending.fromStatus,
                currentPending.patientId,
              )
            );
            const originalDraggedState: IDraggedItem = {
              type: currentPending.draggedType,
              status: currentPending.fromStatus,
              idx: 0,
              patientId: currentPending.patientId,
              isCombinedTreatment: isCombined,
              treatmentTypes: isCombined
                ? ['physiotherapy', 'tens']
                : [currentPending.draggedType],
            };

            setDragged(originalDraggedState);
            await performMove(currentPending.draggedType, currentPending.toStatus);
            setDragged(null);
          },
        );
        setDragged(null);
        return true;
      };

      if (handleAssessmentBeforeTreatmentFlow()) return;
      if (await handleNewPatientCheckInFlow()) return;
      if (handleCompletionFlow()) return;
      if (handleMultiSectionFlow()) return;

      if (isValidMove(dragged, toType, toStatus)) {
        performMove(toType, toStatus);
      }
      setDragged(null);
    },
    [
      dragged,
      attendancesByDate,
      findPatient,
      patients,
      openNewPatientCheckIn,
      openAssessmentBeforeTreatmentConfirm,
      performMove,
      openPostAttendance,
      openPostTreatment,
      openMultiSection,
      refreshCurrentDate,
      setAttendancesByDate,
      showToast,
      updateAttendanceStatus,
      updatePatientMutation,
      setDragged,
    ],
  );

  return { handleDropWithConfirm };
}
