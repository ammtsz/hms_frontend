/**
 * Agenda Store Selectors
 *
 * Optimized selectors for the agenda store to prevent unnecessary re-renders
 * and provide cleaner component interfaces.
 */

import { useAgendaStore } from './agendaStore';

// Individual state selectors (optimal performance - single property subscriptions)
export const useSelectedDateString = () =>
  useAgendaStore((state) => state.selectedDateString);
export const useAgendaDayWindowDays = () =>
  useAgendaStore((state) => state.agendaDayWindowDays);
export const useAgendaStatusFilters = () =>
  useAgendaStore((state) => state.agendaStatusFilters);
export const usePatientFilter = () =>
  useAgendaStore((state) => state.patientFilter);
export const useConfirmRemove = () =>
  useAgendaStore((state) => state.confirmRemove);
export const useShowNewAttendance = () =>
  useAgendaStore((state) => state.showNewAttendance);
export const useOpenAssessmentIdx = () =>
  useAgendaStore((state) => state.openAssessmentIdx);
export const useOpenPhysiotherapyIdx = () =>
  useAgendaStore((state) => state.openPhysiotherapyIdx);

// Individual action selectors (stable function references)
export const useSetSelectedDateString = () =>
  useAgendaStore((state) => state.setSelectedDateString);
export const useSetAgendaDayWindowDays = () =>
  useAgendaStore((state) => state.setAgendaDayWindowDays);
export const useSetAgendaStatusFilters = () =>
  useAgendaStore((state) => state.setAgendaStatusFilters);
export const useSetPatientFilter = () =>
  useAgendaStore((state) => state.setPatientFilter);
export const useSetConfirmRemove = () =>
  useAgendaStore((state) => state.setConfirmRemove);
export const useSetShowNewAttendance = () =>
  useAgendaStore((state) => state.setShowNewAttendance);
export const useSetOpenAssessmentIdx = () =>
  useAgendaStore((state) => state.setOpenAssessmentIdx);
export const useSetOpenPhysiotherapyIdx = () =>
  useAgendaStore((state) => state.setOpenPhysiotherapyIdx);

// Combined actions (use only when you need multiple actions together)
export const useAgendaActions = () => ({
  setSelectedDateString: useSetSelectedDateString(),
  setAgendaDayWindowDays: useSetAgendaDayWindowDays(),
  setAgendaStatusFilters: useSetAgendaStatusFilters(),
  setPatientFilter: useSetPatientFilter(),
  setConfirmRemove: useSetConfirmRemove(),
  setShowNewAttendance: useSetShowNewAttendance(),
  setOpenAssessmentIdx: useSetOpenAssessmentIdx(),
  setOpenPhysiotherapyIdx: useSetOpenPhysiotherapyIdx(),
});

// Performance-optimized selectors for specific use cases
export const useAgendaDateFilter = () => ({
  selectedDate: useAgendaStore((state) => state.selectedDateString),
  agendaDayWindowDays: useAgendaStore((state) => state.agendaDayWindowDays),
  agendaStatusFilters: useAgendaStore((state) => state.agendaStatusFilters),
  patientFilter: useAgendaStore((state) => state.patientFilter),
});

export const useAgendaModals = () => ({
  confirmRemove: useAgendaStore((state) => state.confirmRemove),
  showNewAttendance: useAgendaStore((state) => state.showNewAttendance),
});

export const useAgendaAccordions = () => ({
  openAssessmentIdx: useAgendaStore((state) => state.openAssessmentIdx),
  openPhysiotherapyIdx: useAgendaStore((state) => state.openPhysiotherapyIdx),
});
