/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { 
  useModalStore,
  useCancellationModal,
  usePostTreatmentModal,
  useMultiSectionModal,
  useAssessmentBeforeTreatmentConfirmModal,
  useNewPatientCheckInModal,
  usePostAttendanceModal,
  useEndOfDayModal,
  useUnresolvedPastModal,
  useOpenCancellation,
  useOpenMultiSection,
  useOpenAssessmentBeforeTreatmentConfirm,
  useOpenPostTreatment,
  useOpenNewPatientCheckIn,
  useOpenPostAttendance,
  useOpenEndOfDay,
  useOpenUnresolvedPast,
  useCloseModal,
  useSetCancellationLoading,
  useSetPostTreatmentSummaries,
  useSetPostTreatmentLoading,
  useSetPostAttendanceLoading,
  ModalTreatmentSummary
} from '@/stores/modalStore';
import { PatientBasic } from '@/types/types';

describe('Modal Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useModalStore());
    act(() => {
      // Close all modals individually
      result.current.closeModal('cancellation');
      result.current.closeModal('postTreatment');
      result.current.closeModal('multiSection');
      result.current.closeModal('assessmentBeforeTreatmentConfirm');
      result.current.closeModal('newPatientCheckIn');
      result.current.closeModal('postAttendance');
      result.current.closeModal('endOfDay');
      result.current.closeModal('unresolvedPast');
    });
  });

  describe('Cancellation Modal', () => {
    test('should open cancellation modal with correct data', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.openCancellation([123], 'John Doe');
      });

      expect(result.current.cancellation.isOpen).toBe(true);
      expect(result.current.cancellation.attendanceIds).toEqual([123]);
      expect(result.current.cancellation.patientName).toBe('John Doe');
      expect(result.current.cancellation.isLoading).toBe(false);
    });

    test('should close cancellation modal', () => {
      const { result } = renderHook(() => useModalStore());

      // First open the modal
      act(() => {
        result.current.openCancellation([123], 'John Doe');
      });

      expect(result.current.cancellation.isOpen).toBe(true);

      // Then close it
      act(() => {
        result.current.closeModal('cancellation');
      });

      expect(result.current.cancellation.isOpen).toBe(false);
      expect(result.current.cancellation.isLoading).toBe(false);
    });

    test('should set loading state', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.setCancellationLoading(true);
      });

      expect(result.current.cancellation.isLoading).toBe(true);

      act(() => {
        result.current.setCancellationLoading(false);
      });

      expect(result.current.cancellation.isLoading).toBe(false);
    });
  });

  describe('Multi Section Modal', () => {
    test('should open multi section modal with callbacks', () => {
      const { result } = renderHook(() => useModalStore());
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      act(() => {
        result.current.openMultiSection(onConfirm, onCancel);
      });

      expect(result.current.multiSection.isOpen).toBe(true);
      expect(result.current.multiSection.onConfirm).toBe(onConfirm);
      expect(result.current.multiSection.onCancel).toBe(onCancel);
    });

    test('should close multi section modal and reset callbacks', () => {
      const { result } = renderHook(() => useModalStore());
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      // Open modal first
      act(() => {
        result.current.openMultiSection(onConfirm, onCancel);
      });

      expect(result.current.multiSection.isOpen).toBe(true);

      // Close modal
      act(() => {
        result.current.closeModal('multiSection');
      });

      expect(result.current.multiSection.isOpen).toBe(false);
      expect(result.current.multiSection.onConfirm).toBeUndefined();
      expect(result.current.multiSection.onCancel).toBeUndefined();
    });
  });

  describe('Assessment Before Treatment Confirm Modal', () => {
    test('should open assessment before treatment confirm modal with callbacks', () => {
      const { result } = renderHook(() => useModalStore());
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      act(() => {
        result.current.openAssessmentBeforeTreatmentConfirm(onConfirm, onCancel);
      });

      expect(result.current.assessmentBeforeTreatmentConfirm.isOpen).toBe(true);
      expect(result.current.assessmentBeforeTreatmentConfirm.onConfirm).toBe(onConfirm);
      expect(result.current.assessmentBeforeTreatmentConfirm.onCancel).toBe(onCancel);
    });

    test('should close assessment before treatment confirm modal and reset callbacks', () => {
      const { result } = renderHook(() => useModalStore());
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      act(() => {
        result.current.openAssessmentBeforeTreatmentConfirm(onConfirm, onCancel);
      });

      expect(result.current.assessmentBeforeTreatmentConfirm.isOpen).toBe(true);

      act(() => {
        result.current.closeModal('assessmentBeforeTreatmentConfirm');
      });

      expect(result.current.assessmentBeforeTreatmentConfirm.isOpen).toBe(false);
      expect(result.current.assessmentBeforeTreatmentConfirm.onConfirm).toBeUndefined();
      expect(result.current.assessmentBeforeTreatmentConfirm.onCancel).toBeUndefined();
    });
  });

  describe('Post Treatment Modal', () => {
    test('should open post treatment modal with correct data', () => {
      const { result } = renderHook(() => useModalStore());
      const onComplete = jest.fn();
      const data = {
        attendanceIds: [123],
        patientId: 456,
        patientName: 'John Doe',
        attendanceType: 'assessment' as const,
        onComplete
      };

      act(() => {
        result.current.openPostTreatment(data);
      });

      expect(result.current.postTreatment.isOpen).toBe(true);
      expect(result.current.postTreatment.attendanceIds).toEqual([123]);
      expect(result.current.postTreatment.patientId).toBe(456);
      expect(result.current.postTreatment.patientName).toBe('John Doe');
      expect(result.current.postTreatment.attendanceType).toBe('assessment');
      expect(result.current.postTreatment.treatmentSummaries).toEqual([]);
      expect(result.current.postTreatment.isLoadingTreatmentSummaries).toBe(false);
      expect(result.current.postTreatment.onComplete).toBe(onComplete);
    });

    test('should close post treatment modal and reset data', () => {
      const { result } = renderHook(() => useModalStore());
      const onComplete = jest.fn();
      const data = {
        attendanceIds: [123],
        patientId: 456,
        patientName: 'John Doe',
        attendanceType: 'assessment' as const,
        onComplete
      };

      // Open modal first
      act(() => {
        result.current.openPostTreatment(data);
      });

      expect(result.current.postTreatment.isOpen).toBe(true);

      // Close modal
      act(() => {
        result.current.closeModal('postTreatment');
      });

      expect(result.current.postTreatment.isOpen).toBe(false);
      expect(result.current.postTreatment.attendanceIds).toBeUndefined();
      expect(result.current.postTreatment.patientId).toBeUndefined();
      expect(result.current.postTreatment.patientName).toBeUndefined();
      expect(result.current.postTreatment.attendanceType).toBeUndefined();
      expect(result.current.postTreatment.treatmentSummaries).toEqual([]);
      expect(result.current.postTreatment.isLoadingTreatmentSummaries).toBe(false);
      expect(result.current.postTreatment.onComplete).toBeUndefined();
    });

    test('should set post treatment sessions', () => {
      const { result } = renderHook(() => useModalStore());
      const sessions: ModalTreatmentSummary[] = [
        { 
          id: 1, 
          treatmentType: 'physiotherapy',
          bodyLocations: ['head'],
          startDate: '2024-01-01',
          plannedSessions: 5,
          completedSessions: 1,
          status: 'in_progress'
        },
        { 
          id: 2, 
          treatmentType: 'tens',
          bodyLocations: ['back'],
          startDate: '2024-01-02',
          plannedSessions: 3,
          completedSessions: 0,
          status: 'scheduled'
        }
      ];

      act(() => {
        result.current.setPostTreatmentSummaries(sessions);
      });

      expect(result.current.postTreatment.treatmentSummaries).toEqual(sessions);
    });

    test('should set post treatment loading state', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.setPostTreatmentLoading(true);
      });

      expect(result.current.postTreatment.isLoadingTreatmentSummaries).toBe(true);

      act(() => {
        result.current.setPostTreatmentLoading(false);
      });

      expect(result.current.postTreatment.isLoadingTreatmentSummaries).toBe(false);
    });
  });

  describe('New Patient Check-In Modal', () => {
    test('should open new patient check-in modal with correct data', () => {
      const { result } = renderHook(() => useModalStore());
      const patient: PatientBasic = {
        id: '1',
        name: 'Jane Doe',
        phone: '(11) 99999-9999',
        priority: '2',
        status: 'A'
      };
      const onComplete = jest.fn();

      act(() => {
        result.current.openNewPatientCheckIn({
          patient,
          attendanceId: 789,
          onComplete
        });
      });

      expect(result.current.newPatientCheckIn.isOpen).toBe(true);
      expect(result.current.newPatientCheckIn.patient).toBe(patient);
      expect(result.current.newPatientCheckIn.attendanceId).toBe(789);
      expect(result.current.newPatientCheckIn.onComplete).toBe(onComplete);
    });

    test('should close new patient check-in modal and reset data', () => {
      const { result } = renderHook(() => useModalStore());
      const patient: PatientBasic = {
        id: '1',
        name: 'Jane Doe',
        phone: '(11) 99999-9999',
        priority: '2',
        status: 'A'
      };
      const onComplete = jest.fn();

      // Open modal first
      act(() => {
        result.current.openNewPatientCheckIn({
          patient,
          attendanceId: 789,
          onComplete
        });
      });

      expect(result.current.newPatientCheckIn.isOpen).toBe(true);

      // Close modal
      act(() => {
        result.current.closeModal('newPatientCheckIn');
      });

      expect(result.current.newPatientCheckIn.isOpen).toBe(false);
      expect(result.current.newPatientCheckIn.patient).toBeUndefined();
      expect(result.current.newPatientCheckIn.attendanceId).toBeUndefined();
      expect(result.current.newPatientCheckIn.onComplete).toBeUndefined();
    });
  });

  describe('Post Attendance Modal', () => {
    test('should open post attendance modal with correct data', () => {
      const { result } = renderHook(() => useModalStore());
      const onComplete = jest.fn();
      const data = {
        attendanceId: 123,
        patientId: 456,
        patientName: 'John Doe',
        attendanceType: 'assessment' as const,
        currentTreatmentStatus: 'Active',
        currentStartDate: new Date('2024-01-01'),
        currentReturnWeeks: 4,
        isFirstAttendance: true,
        isLoading: false,
        initialData: undefined,
        onComplete
      };

      act(() => {
        result.current.openPostAttendance(data);
      });

      expect(result.current.postAttendance.isOpen).toBe(true);
      expect(result.current.postAttendance.attendanceId).toBe(123);
      expect(result.current.postAttendance.patientId).toBe(456);
      expect(result.current.postAttendance.patientName).toBe('John Doe');
      expect(result.current.postAttendance.attendanceType).toBe('assessment');
      expect(result.current.postAttendance.currentTreatmentStatus).toBe('Active');
      expect(result.current.postAttendance.currentStartDate).toEqual(new Date('2024-01-01'));
      expect(result.current.postAttendance.currentReturnWeeks).toBe(4);
      expect(result.current.postAttendance.isFirstAttendance).toBe(true);
      expect(result.current.postAttendance.isLoading).toBe(false);
      expect(result.current.postAttendance.onComplete).toBe(onComplete);
    });

    test('should close post attendance modal and reset data', () => {
      const { result } = renderHook(() => useModalStore());
      const onComplete = jest.fn();
      const data = {
        attendanceId: 123,
        patientId: 456,
        patientName: 'John Doe',
        attendanceType: 'assessment' as const,
        currentTreatmentStatus: 'Active',
        currentStartDate: new Date('2024-01-01'),
        currentReturnWeeks: 4,
        isFirstAttendance: true,
        isLoading: false,
        initialData: undefined,
        onComplete
      };

      // Open modal first
      act(() => {
        result.current.openPostAttendance(data);
      });

      expect(result.current.postAttendance.isOpen).toBe(true);

      // Close modal
      act(() => {
        result.current.closeModal('postAttendance');
      });

      expect(result.current.postAttendance.isOpen).toBe(false);
      expect(result.current.postAttendance.attendanceId).toBeUndefined();
      expect(result.current.postAttendance.patientId).toBeUndefined();
      expect(result.current.postAttendance.patientName).toBeUndefined();
      expect(result.current.postAttendance.attendanceType).toBeUndefined();
      expect(result.current.postAttendance.currentTreatmentStatus).toBeUndefined();
      expect(result.current.postAttendance.currentStartDate).toBeUndefined();
      expect(result.current.postAttendance.currentReturnWeeks).toBeUndefined();
      expect(result.current.postAttendance.isFirstAttendance).toBeUndefined();
      expect(result.current.postAttendance.isLoading).toBeUndefined();
      expect(result.current.postAttendance.onComplete).toBeUndefined();
    });

    test('should set post attendance loading state', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.setPostAttendanceLoading(true);
      });

      expect(result.current.postAttendance.isLoading).toBe(true);

      act(() => {
        result.current.setPostAttendanceLoading(false);
      });

      expect(result.current.postAttendance.isLoading).toBe(false);
    });
  });

  describe('End of Day Modal', () => {
    test('should open end of day modal with correct data', () => {
      const { result } = renderHook(() => useModalStore());
      const data = {
        selectedDate: '2024-01-01'
      };

      act(() => {
        result.current.openEndOfDay(data);
      });

      expect(result.current.endOfDay.isOpen).toBe(true);
      expect(result.current.endOfDay.selectedDate).toBe('2024-01-01');
    });

    test('should close end of day modal and reset data', () => {
      const { result } = renderHook(() => useModalStore());
      const data = {
        selectedDate: '2024-01-01'
      };

      // Open modal first
      act(() => {
        result.current.openEndOfDay(data);
      });

      expect(result.current.endOfDay.isOpen).toBe(true);

      // Close modal
      act(() => {
        result.current.closeModal('endOfDay');
      });

      expect(result.current.endOfDay.isOpen).toBe(false);
      expect(result.current.endOfDay.selectedDate).toBeUndefined();
    });
  });

  describe('Selector Hooks', () => {
    test('should work with individual selector hooks', () => {
      const { result: cancellationResult } = renderHook(() => useCancellationModal());
      const { result: postTreatmentResult } = renderHook(() => usePostTreatmentModal());
      const { result: multiSectionResult } = renderHook(() => useMultiSectionModal());
      const { result: assessmentConfirmResult } = renderHook(() => useAssessmentBeforeTreatmentConfirmModal());
      const { result: newPatientResult } = renderHook(() => useNewPatientCheckInModal());
      const { result: postAttendanceResult } = renderHook(() => usePostAttendanceModal());
      const { result: endOfDayResult } = renderHook(() => useEndOfDayModal());

      // Test that hooks return the correct initial state
      expect(cancellationResult.current.isOpen).toBe(false);
      expect(postTreatmentResult.current.isOpen).toBe(false);
      expect(multiSectionResult.current.isOpen).toBe(false);
      expect(assessmentConfirmResult.current.isOpen).toBe(false);
      expect(newPatientResult.current.isOpen).toBe(false);
      expect(postAttendanceResult.current.isOpen).toBe(false);
      expect(endOfDayResult.current.isOpen).toBe(false);
    });

    test('should work with action hooks', () => {
      const { result: openCancellation } = renderHook(() => useOpenCancellation());
      const { result: openMultiSection } = renderHook(() => useOpenMultiSection());
      const { result: openAssessmentConfirm } = renderHook(() => useOpenAssessmentBeforeTreatmentConfirm());
      const { result: openPostTreatment } = renderHook(() => useOpenPostTreatment());
      const { result: openNewPatient } = renderHook(() => useOpenNewPatientCheckIn());
      const { result: openPostAttendance } = renderHook(() => useOpenPostAttendance());
      const { result: openEndOfDay } = renderHook(() => useOpenEndOfDay());
      const { result: closeModal } = renderHook(() => useCloseModal());
      const { result: setCancellationLoading } = renderHook(() => useSetCancellationLoading());
      const { result: setPostTreatmentSummaries } = renderHook(() => useSetPostTreatmentSummaries());
      const { result: setPostTreatmentLoading } = renderHook(() => useSetPostTreatmentLoading());
      const { result: setPostAttendanceLoading } = renderHook(() => useSetPostAttendanceLoading());

      // Test that all action hooks return functions
      expect(typeof openCancellation.current).toBe('function');
      expect(typeof openMultiSection.current).toBe('function');
      expect(typeof openAssessmentConfirm.current).toBe('function');
      expect(typeof openPostTreatment.current).toBe('function');
      expect(typeof openNewPatient.current).toBe('function');
      expect(typeof openPostAttendance.current).toBe('function');
      expect(typeof openEndOfDay.current).toBe('function');
      expect(typeof closeModal.current).toBe('function');
      expect(typeof setCancellationLoading.current).toBe('function');
      expect(typeof setPostTreatmentSummaries.current).toBe('function');
      expect(typeof setPostTreatmentLoading.current).toBe('function');
      expect(typeof setPostAttendanceLoading.current).toBe('function');
    });
  });

  describe('Unresolved Past Modal', () => {
    test('should open unresolved past modal with dates array', () => {
      const { result } = renderHook(() => useModalStore());

      const mockDates = [
        { date: '2026-01-30', count: 3, statuses: ['scheduled', 'checked_in'] },
        { date: '2026-01-28', count: 2, statuses: ['scheduled'] },
      ];

      act(() => {
        result.current.openUnresolvedPast(mockDates);
      });

      expect(result.current.unresolvedPast.isOpen).toBe(true);
      expect(result.current.unresolvedPast.dates).toEqual(mockDates);
    });

    test('should close unresolved past modal and clear dates', () => {
      const { result } = renderHook(() => useModalStore());

      const mockDates = [
        { date: '2026-01-30', count: 3, statuses: ['scheduled'] },
      ];

      act(() => {
        result.current.openUnresolvedPast(mockDates);
      });

      expect(result.current.unresolvedPast.isOpen).toBe(true);

      act(() => {
        result.current.closeModal('unresolvedPast');
      });

      expect(result.current.unresolvedPast.isOpen).toBe(false);
      expect(result.current.unresolvedPast.dates).toEqual([]);
    });

    test('should handle empty dates array', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.openUnresolvedPast([]);
      });

      expect(result.current.unresolvedPast.isOpen).toBe(true);
      expect(result.current.unresolvedPast.dates).toEqual([]);
    });

    test('should update dates when opening modal multiple times', () => {
      const { result } = renderHook(() => useModalStore());

      const firstDates = [
        { date: '2026-01-30', count: 1, statuses: ['scheduled'] },
      ];

      const secondDates = [
        { date: '2026-01-28', count: 2, statuses: ['checked_in'] },
        { date: '2026-01-27', count: 1, statuses: ['scheduled'] },
      ];

      act(() => {
        result.current.openUnresolvedPast(firstDates);
      });

      expect(result.current.unresolvedPast.dates).toEqual(firstDates);

      act(() => {
        result.current.openUnresolvedPast(secondDates);
      });

      expect(result.current.unresolvedPast.dates).toEqual(secondDates);
    });

    test('useUnresolvedPastModal selector should return modal state', () => {
      const { result: storeResult } = renderHook(() => useModalStore());
      const { result: selectorResult } = renderHook(() => useUnresolvedPastModal());

      const mockDates = [
        { date: '2026-01-30', count: 3, statuses: ['scheduled'] },
      ];

      act(() => {
        storeResult.current.openUnresolvedPast(mockDates);
      });

      expect(selectorResult.current.isOpen).toBe(true);
      expect(selectorResult.current.dates).toEqual(mockDates);
    });

    test('useOpenUnresolvedPast selector should return function', () => {
      const { result: openResult } = renderHook(() => useOpenUnresolvedPast());
      const { result: storeResult } = renderHook(() => useModalStore());

      const mockDates = [
        { date: '2026-01-30', count: 2, statuses: ['scheduled'] },
      ];

      act(() => {
        openResult.current(mockDates);
      });

      expect(storeResult.current.unresolvedPast.isOpen).toBe(true);
      expect(storeResult.current.unresolvedPast.dates).toEqual(mockDates);
    });
  });
});