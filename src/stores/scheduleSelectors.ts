/**
 * Schedule Store Selectors
 *
 * Optimized selectors for the schedule store to prevent unnecessary re-renders
 * and provide cleaner component interfaces.
 */

import { useScheduleStore } from './scheduleStore';

// Individual state selectors (optimal performance - single property subscriptions)
export const useSelectedDateString = () =>
  useScheduleStore((state) => state.selectedDateString);
export const useScheduleDayWindowDays = () =>
  useScheduleStore((state) => state.scheduleDayWindowDays);
export const useScheduleStatusFilters = () =>
  useScheduleStore((state) => state.scheduleStatusFilters);
export const usePatientFilter = () =>
  useScheduleStore((state) => state.patientFilter);
export const useConfirmRemove = () =>
  useScheduleStore((state) => state.confirmRemove);
export const useShowNewAppointment = () =>
  useScheduleStore((state) => state.showNewAppointment);
export const useOpenAssessmentIdx = () =>
  useScheduleStore((state) => state.openAssessmentIdx);
export const useOpenPhysiotherapyIdx = () =>
  useScheduleStore((state) => state.openPhysiotherapyIdx);

// Individual action selectors (stable function references)
export const useSetSelectedDateString = () =>
  useScheduleStore((state) => state.setSelectedDateString);
export const useSetScheduleDayWindowDays = () =>
  useScheduleStore((state) => state.setScheduleDayWindowDays);
export const useSetScheduleStatusFilters = () =>
  useScheduleStore((state) => state.setScheduleStatusFilters);
export const useSetPatientFilter = () =>
  useScheduleStore((state) => state.setPatientFilter);
export const useSetConfirmRemove = () =>
  useScheduleStore((state) => state.setConfirmRemove);
export const useSetShowNewAppointment = () =>
  useScheduleStore((state) => state.setShowNewAppointment);
export const useSetOpenAssessmentIdx = () =>
  useScheduleStore((state) => state.setOpenAssessmentIdx);
export const useSetOpenPhysiotherapyIdx = () =>
  useScheduleStore((state) => state.setOpenPhysiotherapyIdx);

// Combined actions (use only when you need multiple actions together)
export const useScheduleActions = () => ({
  setSelectedDateString: useSetSelectedDateString(),
  setScheduleDayWindowDays: useSetScheduleDayWindowDays(),
  setScheduleStatusFilters: useSetScheduleStatusFilters(),
  setPatientFilter: useSetPatientFilter(),
  setConfirmRemove: useSetConfirmRemove(),
  setShowNewAppointment: useSetShowNewAppointment(),
  setOpenAssessmentIdx: useSetOpenAssessmentIdx(),
  setOpenPhysiotherapyIdx: useSetOpenPhysiotherapyIdx(),
});

// Performance-optimized selectors for specific use cases
export const useScheduleDateFilter = () => ({
  selectedDate: useScheduleStore((state) => state.selectedDateString),
  scheduleDayWindowDays: useScheduleStore((state) => state.scheduleDayWindowDays),
  scheduleStatusFilters: useScheduleStore((state) => state.scheduleStatusFilters),
  patientFilter: useScheduleStore((state) => state.patientFilter),
});

export const useScheduleModals = () => ({
  confirmRemove: useScheduleStore((state) => state.confirmRemove),
  showNewAppointment: useScheduleStore((state) => state.showNewAppointment),
});

export const useScheduleAccordions = () => ({
  openAssessmentIdx: useScheduleStore((state) => state.openAssessmentIdx),
  openPhysiotherapyIdx: useScheduleStore((state) => state.openPhysiotherapyIdx),
});
