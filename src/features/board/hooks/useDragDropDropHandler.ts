import { useCallback } from 'react';
import { usePatients, useUpdatePatient } from '@/api/query/hooks/usePatientQueries';
import { PatientStatus } from '@/api/types';
import { isNewPatientCheckInDataComplete } from '@/features/board/components/WalkIn/utils/newPatientCheckInValidation';
import type {
  AppointmentProgression,
  AppointmentType,
  AppointmentByDate,
  AppointmentStatusDetail,
} from '@/types/types';
import type { IDraggedItem } from '../types';
import { isAllowedDropTarget, isValidMove } from '@/features/board/utils/dragDropRules';
import {
  findPatientInBoard,
  updatePatientTimestamps,
} from '@/features/board/utils/dragDropAppointmentHelpers';
import { performAppointmentMove } from '@/features/board/utils/dragDropPerformMove';
import type { UpdateAppointmentStatusFn } from './useDragDropStatusUpdater';
import {
  useOpenMultiSection,
  useOpenNewPatientCheckIn,
  useOpenPostAppointment,
  useOpenPostTreatment,
  useOpenAssessmentBeforeTreatmentConfirm,
} from '@/stores/modalStore';
import { useToast } from '@/contexts/ToastContext';

export interface UseDragDropDropHandlerParams {
  dragged: IDraggedItem | null;
  setDragged: (item: IDraggedItem | null) => void;
  appointmentsByDate: AppointmentByDate | null;
  setAppointmentsByDate: (data: AppointmentByDate | null) => void;
  refreshCurrentDate: () => Promise<void>;
  updateAppointmentStatus: UpdateAppointmentStatusFn;
}

export function useDragDropDropHandler({
  dragged,
  setDragged,
  appointmentsByDate,
  setAppointmentsByDate,
  refreshCurrentDate,
  updateAppointmentStatus,
}: UseDragDropDropHandlerParams) {
  const { data: patients = [] } = usePatients();
  const updatePatientMutation = useUpdatePatient();

  const openPostConsultation = useOpenPostAppointment();
  const openPostTreatment = useOpenPostTreatment();
  const openNewPatientCheckIn = useOpenNewPatientCheckIn();
  const openMultiSection = useOpenMultiSection();
  const openAssessmentBeforeTreatmentConfirm =
    useOpenAssessmentBeforeTreatmentConfirm();
  const { showToast } = useToast();

  const findPatient = useCallback(
    (
      type: AppointmentType,
      status: AppointmentProgression,
      patientId: number,
    ): AppointmentStatusDetail | undefined =>
      findPatientInBoard(appointmentsByDate, type, status, patientId),
    [appointmentsByDate],
  );

  const performMove = useCallback(
    async (toType: AppointmentType, toStatus: AppointmentProgression) => {
      if (!dragged || !appointmentsByDate || !setAppointmentsByDate) return;
      await performAppointmentMove({
        dragged,
        toType,
        toStatus,
        appointmentsByDate,
        setAppointmentsByDate,
        updateAppointmentStatus,
      });
    },
    [dragged, appointmentsByDate, setAppointmentsByDate, updateAppointmentStatus],
  );

  const handleDropWithConfirm = useCallback(
    async (toType: AppointmentType, toStatus: AppointmentProgression) => {
      if (!dragged || !appointmentsByDate) return;

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
              'Patient is already in appointment in another section.',
              'warning',
            );
            setDragged(null);
            return true;
          }
        } else {
          const inAssessment = findPatient('assessment', 'onGoing', patientId);
          if (inAssessment) {
            showToast(
              'Patient is already in appointment in another section.',
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
        const statusesToCheck: AppointmentProgression[] = [
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
              appointmentId: patient.appointmentId,
              patient: patientData,
              onComplete: () => {},
            });
          }
          setDragged(null);
          return true;
        }

        openNewPatientCheckIn({
          appointmentId: patient.appointmentId,
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
        if (!completionPatient?.appointmentId || !completionPatient?.patientId) {
          return false;
        }

        const appointmentType = dragged.type;
        const fullPatient = patients.find((p) => p.name === completionPatient.name);
        const isFirstAppointment = fullPatient?.status === 'N';

        if (appointmentType === 'assessment') {
          openPostConsultation({
            appointmentId: completionPatient.appointmentId,
            patientId: completionPatient.patientId,
            patientName: completionPatient.name,
            appointmentType,
            currentTreatmentStatus: 'T',
            currentStartDate: undefined,
            currentReturnWeeks: undefined,
            isFirstAppointment,
            onComplete: async () => {
              await performMove(appointmentType, 'completed');
            },
          });
        }

        if (appointmentType !== 'assessment') {
          let appointmentIds: number[];
          if (
            dragged.isCombinedTreatment &&
            (appointmentType === 'physiotherapy' || appointmentType === 'tens')
          ) {
            const physiotherapyPatient = findPatient(
              'physiotherapy',
              dragged.status,
              dragged.patientId,
            );
            const tensPatient = findPatient('tens', dragged.status, dragged.patientId);
            const physiotherapyIds =
              physiotherapyPatient?.treatmentAppointmentIds ??
              (physiotherapyPatient?.appointmentId
                ? [physiotherapyPatient.appointmentId]
                : []);
            const tensIds =
              tensPatient?.treatmentAppointmentIds ??
              (tensPatient?.appointmentId ? [tensPatient.appointmentId] : []);
            appointmentIds = [...physiotherapyIds, ...tensIds];
          } else {
            const ids = completionPatient.treatmentAppointmentIds;
            appointmentIds =
              ids != null && ids.length > 0
                ? ids
                : completionPatient.appointmentId != null
                  ? [completionPatient.appointmentId]
                  : [];
          }
          if (appointmentIds.length > 0) {
            openPostTreatment({
              appointmentIds,
              patientId: completionPatient.patientId,
              patientName: completionPatient.name,
              appointmentType,
              onComplete: async (completedAppointmentIds) => {
                if (completedAppointmentIds.length > 0) {
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
            if (!appointmentsByDate || !setAppointmentsByDate) return;

            const syncPromises: Promise<{ success: boolean }>[] = [];
            (['assessment', 'physiotherapy', 'tens'] as AppointmentType[]).forEach(
              (type) => {
                const patientForType = findPatient(
                  type,
                  'scheduled',
                  currentPending.patientId,
                );
                if (patientForType) {
                  const ids = patientForType.treatmentAppointmentIds;
                  const appointmentIds: number[] =
                    ids != null && ids.length > 0
                      ? ids
                      : patientForType.appointmentId != null
                        ? [patientForType.appointmentId]
                        : [];
                  appointmentIds.forEach((appointmentId) => {
                    syncPromises.push(
                      updateAppointmentStatus(appointmentId, 'checkedIn')
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

            let newAppointmentsByDate = { ...appointmentsByDate };
            (['assessment', 'physiotherapy', 'tens'] as AppointmentType[]).forEach(
              (type) => {
                const patientToMove = findPatient(
                  type,
                  'scheduled',
                  currentPending.patientId,
                );
                if (patientToMove) {
                  newAppointmentsByDate = {
                    ...newAppointmentsByDate,
                    [type]: {
                      ...newAppointmentsByDate[type],
                      scheduled: newAppointmentsByDate[type].scheduled.filter(
                        (p) => p.patientId !== currentPending.patientId,
                      ),
                      checkedIn: [
                        ...newAppointmentsByDate[type].checkedIn,
                        updatePatientTimestamps(patientToMove, 'checkedIn'),
                      ],
                    },
                  };
                }
              },
            );

            setAppointmentsByDate(newAppointmentsByDate);
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
      appointmentsByDate,
      findPatient,
      patients,
      openNewPatientCheckIn,
      openAssessmentBeforeTreatmentConfirm,
      performMove,
      openPostConsultation,
      openPostTreatment,
      openMultiSection,
      refreshCurrentDate,
      setAppointmentsByDate,
      showToast,
      updateAppointmentStatus,
      updatePatientMutation,
      setDragged,
    ],
  );

  return { handleDropWithConfirm };
}
