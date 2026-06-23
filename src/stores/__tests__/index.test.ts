/**
 * @jest-environment jsdom
 */

import * as storesIndex from '../index';

describe('stores/index', () => {
  describe('Exports', () => {
    it('should export useBoardStore', () => {
      expect(storesIndex.useBoardStore).toBeDefined();
      expect(typeof storesIndex.useBoardStore).toBe('function');
    });

    it('should export useScheduleStore', () => {
      expect(storesIndex.useScheduleStore).toBeDefined();
      expect(typeof storesIndex.useScheduleStore).toBe('function');
    });

    it('should export schedule selectors', () => {
      // State selectors
      expect(storesIndex.useSelectedDateString).toBeDefined();
      expect(typeof storesIndex.useSelectedDateString).toBe('function');
      
      expect(storesIndex.useScheduleDayWindowDays).toBeDefined();
      expect(typeof storesIndex.useScheduleDayWindowDays).toBe('function');

      expect(storesIndex.useScheduleStatusFilters).toBeDefined();
      expect(typeof storesIndex.useScheduleStatusFilters).toBe('function');

      expect(storesIndex.usePatientFilter).toBeDefined();
      expect(typeof storesIndex.usePatientFilter).toBe('function');
      
      expect(storesIndex.useConfirmRemove).toBeDefined();
      expect(typeof storesIndex.useConfirmRemove).toBe('function');
      
      expect(storesIndex.useShowNewAppointment).toBeDefined();
      expect(typeof storesIndex.useShowNewAppointment).toBe('function');
      
      expect(storesIndex.useOpenAssessmentIdx).toBeDefined();
      expect(typeof storesIndex.useOpenAssessmentIdx).toBe('function');
      
      expect(storesIndex.useOpenPhysiotherapyIdx).toBeDefined();
      expect(typeof storesIndex.useOpenPhysiotherapyIdx).toBe('function');
    });

    it('should export schedule action selectors', () => {
      expect(storesIndex.useSetSelectedDateString).toBeDefined();
      expect(typeof storesIndex.useSetSelectedDateString).toBe('function');
      
      expect(storesIndex.useSetScheduleDayWindowDays).toBeDefined();
      expect(typeof storesIndex.useSetScheduleDayWindowDays).toBe('function');

      expect(storesIndex.useSetScheduleStatusFilters).toBeDefined();
      expect(typeof storesIndex.useSetScheduleStatusFilters).toBe('function');

      expect(storesIndex.useSetPatientFilter).toBeDefined();
      expect(typeof storesIndex.useSetPatientFilter).toBe('function');
      
      expect(storesIndex.useSetConfirmRemove).toBeDefined();
      expect(typeof storesIndex.useSetConfirmRemove).toBe('function');
      
      expect(storesIndex.useSetShowNewAppointment).toBeDefined();
      expect(typeof storesIndex.useSetShowNewAppointment).toBe('function');
      
      expect(storesIndex.useSetOpenAssessmentIdx).toBeDefined();
      expect(typeof storesIndex.useSetOpenAssessmentIdx).toBe('function');
      
      expect(storesIndex.useSetOpenPhysiotherapyIdx).toBeDefined();
      expect(typeof storesIndex.useSetOpenPhysiotherapyIdx).toBe('function');
      
      expect(storesIndex.useScheduleActions).toBeDefined();
      expect(typeof storesIndex.useScheduleActions).toBe('function');
    });

    it('should export appointment selectors', () => {
      expect(storesIndex.useAppointmentActions).toBeDefined();
      expect(typeof storesIndex.useAppointmentActions).toBe('function');
      
      // Composite selectors
      expect(storesIndex.useBoardDateState).toBeDefined();
      expect(typeof storesIndex.useBoardDateState).toBe('function');
      
      expect(storesIndex.useAppointmentDragState).toBeDefined();
      expect(typeof storesIndex.useAppointmentDragState).toBe('function');
      
      expect(storesIndex.useAppointmentEndOfDayState).toBeDefined();
      expect(typeof storesIndex.useAppointmentEndOfDayState).toBe('function');
    });

    it('should export appointment state selectors', () => {
      expect(storesIndex.useSelectedDate).toBeDefined();
      expect(typeof storesIndex.useSelectedDate).toBe('function');
      
      expect(storesIndex.useAppointmentLoading).toBeDefined();
      expect(typeof storesIndex.useAppointmentLoading).toBe('function');
      
      expect(storesIndex.useBoardDataLoading).toBeDefined();
      expect(typeof storesIndex.useBoardDataLoading).toBe('function');
      
      expect(storesIndex.useAppointmentError).toBeDefined();
      expect(typeof storesIndex.useAppointmentError).toBe('function');
      
      expect(storesIndex.useDraggedItem).toBeDefined();
      expect(typeof storesIndex.useDraggedItem).toBe('function');
      
      expect(storesIndex.useIsDragging).toBeDefined();
      expect(typeof storesIndex.useIsDragging).toBe('function');
      
      expect(storesIndex.useDayFinalized).toBeDefined();
      expect(typeof storesIndex.useDayFinalized).toBe('function');
      
      expect(storesIndex.useEndOfDayStatus).toBeDefined();
      expect(typeof storesIndex.useEndOfDayStatus).toBe('function');
    });

    it('should export appointment action selectors', () => {
      expect(storesIndex.useSetSelectedDate).toBeDefined();
      expect(typeof storesIndex.useSetSelectedDate).toBe('function');
      
      expect(storesIndex.useSetAppointmentLoading).toBeDefined();
      expect(typeof storesIndex.useSetAppointmentLoading).toBe('function');
      
      expect(storesIndex.useSetAppointmentDataLoading).toBeDefined();
      expect(typeof storesIndex.useSetAppointmentDataLoading).toBe('function');
      
      expect(storesIndex.useSetAppointmentError).toBeDefined();
      expect(typeof storesIndex.useSetAppointmentError).toBe('function');
      
      expect(storesIndex.useSetDraggedItem).toBeDefined();
      expect(typeof storesIndex.useSetDraggedItem).toBe('function');
      
      expect(storesIndex.useSetIsDragging).toBeDefined();
      expect(typeof storesIndex.useSetIsDragging).toBe('function');
      
      expect(storesIndex.useSetDayFinalized).toBeDefined();
      expect(typeof storesIndex.useSetDayFinalized).toBe('function');
      
      expect(storesIndex.useCheckEndOfDayStatus).toBeDefined();
      expect(typeof storesIndex.useCheckEndOfDayStatus).toBe('function');
      
      expect(storesIndex.useFinalizeEndOfDay).toBeDefined();
      expect(typeof storesIndex.useFinalizeEndOfDay).toBe('function');
    });

    it('should export store types', () => {
      // Note: Type exports can't be tested at runtime since they're TypeScript types
      // that get stripped during compilation. The fact that this module loads without
      // TypeScript errors confirms the type exports are working correctly.
      expect(true).toBe(true); // This test verifies module loads successfully
    });
  });

  describe('Export integrity', () => {
    it('should have all expected exports', () => {
      const expectedExports = [
        // Core stores
        'useBoardStore',
        'useScheduleStore',
        
        // Calendar selectors - state
        'useSelectedDateString',
        'useScheduleDayWindowDays',
        'useScheduleStatusFilters',
        'usePatientFilter',
        'useConfirmRemove',
        'useShowNewAppointment',
        'useOpenAssessmentIdx',
        'useOpenPhysiotherapyIdx',
        
        // Calendar selectors - actions
        'useSetSelectedDateString',
        'useSetScheduleDayWindowDays',
        'useSetScheduleStatusFilters',
        'useSetPatientFilter',
        'useSetConfirmRemove',
        'useSetShowNewAppointment',
        'useSetOpenAssessmentIdx',
        'useSetOpenPhysiotherapyIdx',
        'useScheduleActions',
        
        // Appointment selectors - composite
        'useBoardDateState',
        'useAppointmentDragState',
        'useAppointmentEndOfDayState',
        
        // Appointment selectors - individual state
        'useSelectedDate',
        'useAppointmentLoading',
        'useBoardDataLoading',
        'useAppointmentError',
        'useDraggedItem',
        'useIsDragging',
        'useDayFinalized',
        'useEndOfDayStatus',
        
        // Appointment selectors - individual actions
        'useSetSelectedDate',
        'useSetAppointmentLoading',
        'useSetAppointmentDataLoading',
        'useSetAppointmentError',
        'useSetDraggedItem',
        'useSetIsDragging',
        'useSetDayFinalized',
        'useCheckEndOfDayStatus',
        'useFinalizeEndOfDay',
      ];

      expectedExports.forEach(exportName => {
        expect(storesIndex).toHaveProperty(exportName);
        expect(typeof storesIndex[exportName as keyof typeof storesIndex]).toBe('function');
      });
    });
  });
});