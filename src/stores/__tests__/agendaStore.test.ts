/**
 * Agenda Store Tests
 */

import { act, renderHook } from '@testing-library/react';
import { useAgendaStore } from '../agendaStore';

describe('useAgendaStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAgendaStore.getState().resetState();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      expect(result.current.selectedDate).toBeInstanceOf(Date);
      expect(result.current.selectedTimeSlot).toBe(null);
      expect(result.current.isSchedulingModalOpen).toBe(false);
      expect(result.current.isEditingAppointment).toBe(false);
      expect(result.current.editingAppointmentId).toBe(null);
      expect(result.current.isNavigating).toBe(false);
      expect(result.current.isProcessingSchedule).toBe(false);
    });
  });

  describe('View Management', () => {
    it('should set selected date and update month/year', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      const testDate = new Date('2025-12-25');
      
      act(() => {
        result.current.setSelectedDate(testDate);
      });
      
      expect(result.current.selectedDate).toEqual(testDate);
      expect(result.current.currentMonth).toBe(11); // 0-indexed
      expect(result.current.currentYear).toBe(2025);
    });

    it('should manage time slot selection', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      act(() => {
        result.current.setSelectedTimeSlot('14:00');
      });
      
      expect(result.current.selectedTimeSlot).toBe('14:00');
      
      act(() => {
        result.current.setSelectedTimeSlot(null);
      });
      
      expect(result.current.selectedTimeSlot).toBe(null);
    });
  });

  describe('Navigation', () => {
    it('should navigate to specific date', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      const testDate = new Date('2026-01-15');
      
      act(() => {
        result.current.navigateToDate(testDate);
      });
      
      expect(result.current.selectedDate).toEqual(testDate);
      expect(result.current.currentMonth).toBe(0); // January
      expect(result.current.currentYear).toBe(2026);
    });

    it('should navigate to today', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      // Set a different date first
      const futureDate = new Date('2026-06-15');
      act(() => {
        result.current.setSelectedDate(futureDate);
      });
      
      // Navigate to today
      act(() => {
        result.current.navigateToToday();
      });
      
      const today = new Date();
      expect(result.current.currentMonth).toBe(today.getMonth());
      expect(result.current.currentYear).toBe(today.getFullYear());
    });

    it('should set current month and year separately', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      act(() => {
        result.current.setCurrentMonth(5); // June
        result.current.setCurrentYear(2026);
      });
      
      expect(result.current.currentMonth).toBe(5);
      expect(result.current.currentYear).toBe(2026);
    });
  });

  describe('Modal Management', () => {
    it('should manage scheduling modal', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      act(() => {
        result.current.openSchedulingModal('10:00');
      });
      
      expect(result.current.isSchedulingModalOpen).toBe(true);
      expect(result.current.selectedTimeSlot).toBe('10:00');
      
      act(() => {
        result.current.closeSchedulingModal();
      });
      
      expect(result.current.isSchedulingModalOpen).toBe(false);
      expect(result.current.selectedTimeSlot).toBe(null);
    });

    it('should manage appointment editing', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      act(() => {
        result.current.startEditingAppointment('appointment-123');
      });
      
      expect(result.current.isEditingAppointment).toBe(true);
      expect(result.current.editingAppointmentId).toBe('appointment-123');
      
      act(() => {
        result.current.stopEditingAppointment();
      });
      
      expect(result.current.isEditingAppointment).toBe(false);
      expect(result.current.editingAppointmentId).toBe(null);
    });
  });

  describe('UI Loading States', () => {
    it('should manage navigation loading', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      act(() => {
        result.current.setIsNavigating(true);
      });
      
      expect(result.current.isNavigating).toBe(true);
      
      act(() => {
        result.current.setIsNavigating(false);
      });
      
      expect(result.current.isNavigating).toBe(false);
    });

    it('should manage schedule processing loading', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      act(() => {
        result.current.setIsProcessingSchedule(true);
      });
      
      expect(result.current.isProcessingSchedule).toBe(true);
      
      act(() => {
        result.current.setIsProcessingSchedule(false);
      });
      
      expect(result.current.isProcessingSchedule).toBe(false);
    });
  });

  describe('State Reset', () => {
    it('should reset state to initial values', () => {
      const { result } = renderHook(() => useAgendaStore());
      
      // Modify state
      act(() => {
        result.current.setSelectedTimeSlot('15:00');
        result.current.openSchedulingModal();
        result.current.startEditingAppointment('test-id');
        result.current.setIsNavigating(true);
      });
      
      // Reset state
      act(() => {
        result.current.resetState();
      });
      
      // Check initial values are restored
      expect(result.current.selectedTimeSlot).toBe(null);
      expect(result.current.isSchedulingModalOpen).toBe(false);
      expect(result.current.isEditingAppointment).toBe(false);
      expect(result.current.editingAppointmentId).toBe(null);
      expect(result.current.isNavigating).toBe(false);
    });
  });
});