/**
 * Schedule Store Selectors Tests
 */

import { renderHook, act } from '@testing-library/react';
import {
  useScheduleActions,
  useScheduleDateFilter,
  useScheduleModals,
  useScheduleAccordions,
} from '../scheduleSelectors';
import { useScheduleStore, defaultScheduleCalendarStatusFilters } from '../scheduleStore';
import { AppointmentStatus } from '@/api/types';

describe('scheduleSelectors', () => {
  beforeEach(() => {
    useScheduleStore.getState().resetState();
  });

  describe('useScheduleActions', () => {
    it('should return all action functions', () => {
      const { result } = renderHook(() => useScheduleActions());

      expect(typeof result.current.setSelectedDateString).toBe('function');
      expect(typeof result.current.setScheduleDayWindowDays).toBe('function');
      expect(typeof result.current.setScheduleStatusFilters).toBe('function');
      expect(typeof result.current.setConfirmRemove).toBe('function');
      expect(typeof result.current.setShowNewAppointment).toBe('function');
      expect(typeof result.current.setOpenAssessmentIdx).toBe('function');
      expect(typeof result.current.setOpenPhysiotherapyIdx).toBe('function');
    });

    it('should allow state updates through actions', () => {
      const { result: actionsResult } = renderHook(() => useScheduleActions());
      const { result: dateResult } = renderHook(() => useScheduleDateFilter());
      const { result: modalsResult } = renderHook(() => useScheduleModals());

      act(() => {
        actionsResult.current.setSelectedDateString('2025-12-25');
        actionsResult.current.setShowNewAppointment(true);
        actionsResult.current.setScheduleStatusFilters([AppointmentStatus.COMPLETED]);
      });

      expect(dateResult.current.selectedDate).toBe('2025-12-25');
      expect(dateResult.current.scheduleStatusFilters).toEqual([
        AppointmentStatus.COMPLETED,
      ]);
      expect(modalsResult.current.showNewAppointment).toBe(true);
    });
  });

  describe('useScheduleDateFilter', () => {
    it('should return only date-related state', () => {
      const { result } = renderHook(() => useScheduleDateFilter());

      expect(result.current).toEqual({
        selectedDate: '',
        scheduleDayWindowDays: 30,
        scheduleStatusFilters: defaultScheduleCalendarStatusFilters(),
        patientFilter: '',
      });
    });

    it('should not include other state properties', () => {
      const { result } = renderHook(() => useScheduleDateFilter());

      expect(result.current).not.toHaveProperty('confirmRemove');
      expect(result.current).not.toHaveProperty('showNewAppointment');
      expect(result.current).not.toHaveProperty('openAssessmentIdx');
    });
  });

  describe('Performance: Individual subscriptions', () => {
    it('should only re-render when subscribed state changes', () => {
      let dateFilterRenders = 0;
      let modalsRenders = 0;

      renderHook(() => {
        dateFilterRenders++;
        return useScheduleDateFilter();
      });

      renderHook(() => {
        modalsRenders++;
        return useScheduleModals();
      });

      const { result: actionsResult } = renderHook(() => useScheduleActions());

      expect(dateFilterRenders).toBe(1);
      expect(modalsRenders).toBe(1);

      act(() => {
        actionsResult.current.setSelectedDateString('2025-10-27');
      });

      expect(dateFilterRenders).toBe(2);
      expect(modalsRenders).toBe(1);

      act(() => {
        actionsResult.current.setShowNewAppointment(true);
      });

      expect(dateFilterRenders).toBe(2);
      expect(modalsRenders).toBe(2);
    });
  });

  describe('useScheduleModals', () => {
    it('should return modal-specific state', () => {
      const { result } = renderHook(() => useScheduleModals());

      expect(result.current).toEqual({
        confirmRemove: null,
        showNewAppointment: false,
      });
    });

    it('should update when modal state changes', () => {
      const { result: modalsResult } = renderHook(() => useScheduleModals());
      const { result: actionsResult } = renderHook(() => useScheduleActions());

      const confirmRemoveData = {
        id: '123',
        date: '2024-01-01',
        name: 'Test',
        type: 'assessment' as const,
        appointmentIds: [456],
      };

      act(() => {
        actionsResult.current.setConfirmRemove(confirmRemoveData);
        actionsResult.current.setShowNewAppointment(true);
      });

      expect(modalsResult.current.confirmRemove).toEqual(confirmRemoveData);
      expect(modalsResult.current.showNewAppointment).toBe(true);
    });
  });

  describe('useScheduleAccordions', () => {
    it('should return accordion-specific state', () => {
      const { result } = renderHook(() => useScheduleAccordions());

      expect(result.current).toEqual({
        openAssessmentIdx: [],
        openPhysiotherapyIdx: [],
      });
    });

    it('should update when accordion state changes', () => {
      const { result: accordionsResult } = renderHook(() => useScheduleAccordions());
      const { result: actionsResult } = renderHook(() => useScheduleActions());

      act(() => {
        actionsResult.current.setOpenAssessmentIdx([0]);
        actionsResult.current.setOpenPhysiotherapyIdx([2]);
      });

      expect(accordionsResult.current.openAssessmentIdx).toEqual([0]);
      expect(accordionsResult.current.openPhysiotherapyIdx).toEqual([2]);
    });
  });
});
