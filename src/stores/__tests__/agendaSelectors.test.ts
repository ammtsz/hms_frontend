/**
 * Agenda Store Selectors Tests
 */

import { renderHook, act } from '@testing-library/react';
import {
  useAgendaActions,
  useAgendaDateFilter,
  useAgendaModals,
  useAgendaAccordions,
} from '../agendaSelectors';
import { useAgendaStore, defaultAgendaCalendarStatusFilters } from '../agendaStore';
import { AttendanceStatus } from '@/api/types';

describe('agendaSelectors', () => {
  beforeEach(() => {
    useAgendaStore.getState().resetState();
  });

  describe('useAgendaActions', () => {
    it('should return all action functions', () => {
      const { result } = renderHook(() => useAgendaActions());

      expect(typeof result.current.setSelectedDateString).toBe('function');
      expect(typeof result.current.setAgendaDayWindowDays).toBe('function');
      expect(typeof result.current.setAgendaStatusFilters).toBe('function');
      expect(typeof result.current.setConfirmRemove).toBe('function');
      expect(typeof result.current.setShowNewAttendance).toBe('function');
      expect(typeof result.current.setOpenAssessmentIdx).toBe('function');
      expect(typeof result.current.setOpenPhysiotherapyIdx).toBe('function');
    });

    it('should allow state updates through actions', () => {
      const { result: actionsResult } = renderHook(() => useAgendaActions());
      const { result: dateResult } = renderHook(() => useAgendaDateFilter());
      const { result: modalsResult } = renderHook(() => useAgendaModals());

      act(() => {
        actionsResult.current.setSelectedDateString('2025-12-25');
        actionsResult.current.setShowNewAttendance(true);
        actionsResult.current.setAgendaStatusFilters([AttendanceStatus.COMPLETED]);
      });

      expect(dateResult.current.selectedDate).toBe('2025-12-25');
      expect(dateResult.current.agendaStatusFilters).toEqual([
        AttendanceStatus.COMPLETED,
      ]);
      expect(modalsResult.current.showNewAttendance).toBe(true);
    });
  });

  describe('useAgendaDateFilter', () => {
    it('should return only date-related state', () => {
      const { result } = renderHook(() => useAgendaDateFilter());

      expect(result.current).toEqual({
        selectedDate: '',
        agendaDayWindowDays: 30,
        agendaStatusFilters: defaultAgendaCalendarStatusFilters(),
        patientFilter: '',
      });
    });

    it('should not include other state properties', () => {
      const { result } = renderHook(() => useAgendaDateFilter());

      expect(result.current).not.toHaveProperty('confirmRemove');
      expect(result.current).not.toHaveProperty('showNewAttendance');
      expect(result.current).not.toHaveProperty('openAssessmentIdx');
    });
  });

  describe('Performance: Individual subscriptions', () => {
    it('should only re-render when subscribed state changes', () => {
      let dateFilterRenders = 0;
      let modalsRenders = 0;

      renderHook(() => {
        dateFilterRenders++;
        return useAgendaDateFilter();
      });

      renderHook(() => {
        modalsRenders++;
        return useAgendaModals();
      });

      const { result: actionsResult } = renderHook(() => useAgendaActions());

      expect(dateFilterRenders).toBe(1);
      expect(modalsRenders).toBe(1);

      act(() => {
        actionsResult.current.setSelectedDateString('2025-10-27');
      });

      expect(dateFilterRenders).toBe(2);
      expect(modalsRenders).toBe(1);

      act(() => {
        actionsResult.current.setShowNewAttendance(true);
      });

      expect(dateFilterRenders).toBe(2);
      expect(modalsRenders).toBe(2);
    });
  });

  describe('useAgendaModals', () => {
    it('should return modal-specific state', () => {
      const { result } = renderHook(() => useAgendaModals());

      expect(result.current).toEqual({
        confirmRemove: null,
        showNewAttendance: false,
      });
    });

    it('should update when modal state changes', () => {
      const { result: modalsResult } = renderHook(() => useAgendaModals());
      const { result: actionsResult } = renderHook(() => useAgendaActions());

      const confirmRemoveData = {
        id: '123',
        date: '2024-01-01',
        name: 'Test',
        type: 'assessment' as const,
        attendanceIds: [456],
      };

      act(() => {
        actionsResult.current.setConfirmRemove(confirmRemoveData);
        actionsResult.current.setShowNewAttendance(true);
      });

      expect(modalsResult.current.confirmRemove).toEqual(confirmRemoveData);
      expect(modalsResult.current.showNewAttendance).toBe(true);
    });
  });

  describe('useAgendaAccordions', () => {
    it('should return accordion-specific state', () => {
      const { result } = renderHook(() => useAgendaAccordions());

      expect(result.current).toEqual({
        openAssessmentIdx: [],
        openPhysiotherapyIdx: [],
      });
    });

    it('should update when accordion state changes', () => {
      const { result: accordionsResult } = renderHook(() => useAgendaAccordions());
      const { result: actionsResult } = renderHook(() => useAgendaActions());

      act(() => {
        actionsResult.current.setOpenAssessmentIdx([0]);
        actionsResult.current.setOpenPhysiotherapyIdx([2]);
      });

      expect(accordionsResult.current.openAssessmentIdx).toEqual([0]);
      expect(accordionsResult.current.openPhysiotherapyIdx).toEqual([2]);
    });
  });
});
