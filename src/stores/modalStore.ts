import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AttendanceType, PatientBasic } from '@/types/types';

/** Summary rows for post-treatment modal (legacy store field; modal loads plans via React Query). */
export interface ModalTreatmentSummary {
  id: number;
  treatmentType: "physiotherapy" | "tens";
  bodyLocations: string[];
  startDate: string;
  plannedSessions: number;
  completedSessions: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  color?: string;
  durationMinutes?: number;
}

// Modal state interface
interface ModalStore {
  // Cancellation modal state
  cancellation: {
    isOpen: boolean;
    attendanceIds?: number[];
    patientName?: string;
    /** Attendance date (YYYY-MM-DD) used as base when rescheduling by weeks */
    attendanceDate?: string;
    isLoading: boolean;
  };

  // Treatment completion modal state
  postTreatment: {
    isOpen: boolean;
    /** Single attendance (legacy) or all attendance IDs for this completion (grouped card) */
    attendanceId?: number;
    attendanceIds?: number[];
    patientId?: number;
    patientName?: string;
    attendanceType?: AttendanceType;
    treatmentSummaries: ModalTreatmentSummary[];
    isLoadingTreatmentSummaries: boolean;
    /** Called with list of attendance IDs that were completed (not cancelled) */
    onComplete?: (completedAttendanceIds: number[]) => void;
  };

  multiSection: {
    isOpen: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  };

  /** Confirm moving assessment to onGoing when patient has incomplete physiotherapy/tens (Rule 1). */
  assessmentBeforeTreatmentConfirm: {
    isOpen: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  };

  // New PatientBasic CheckIn modal state
  newPatientCheckIn: {
    isOpen: boolean;
    patient?: PatientBasic;
    attendanceId?: number;
    onComplete?: (success: boolean) => void;
  };

  // Treatment Form modal state
  postAttendance: {
    isOpen: boolean;
    attendanceId?: number;
    patientId?: number;
    patientName?: string;
    attendanceType?: string;
    currentTreatmentStatus?: string;
    currentStartDate?: Date;
    currentReturnWeeks?: number;
    isFirstAttendance?: boolean;
    isLoading?: boolean;
    onComplete?: (createdTreatmentIds: number[]) => void;
  };

  // End of Day modal state
  endOfDay: {
    isOpen: boolean;
    selectedDate?: string;
  };

  // View Completed Consultation modal state
  viewCompletedConsultation: {
    isOpen: boolean;
    attendanceId?: number;
    patientId?: number;
    patientName?: string;
  };

  // Unresolved past attendances alert
  unresolvedPast: {
    isOpen: boolean;
    dates: Array<{
      date: string;
      count: number;
      statuses: string[];
    }>;
  };

  // Actions
  openCancellation: (
    attendanceIds: number[],
    patientName: string,
    attendanceDate?: string,
  ) => void;
  openMultiSection: (onConfirm: () => void, onCancel: () => void) => void;
  openAssessmentBeforeTreatmentConfirm: (onConfirm: () => void, onCancel: () => void) => void;
  openNewPatientCheckIn: (data: {
    patient: PatientBasic,
    attendanceId?: number,
    onComplete?: (success: boolean) => void
  }) => void;
  openPostTreatment: (data: {
    /** All attendance IDs for this completion (one for single card, multiple for grouped) */
    attendanceIds: number[];
    patientId: number;
    patientName: string;
    attendanceType: AttendanceType;
    onComplete?: (completedAttendanceIds: number[]) => void;
  }) => void;
  openPostAttendance: (data: {
    attendanceId: number;
    patientId: number;
    patientName: string;
    attendanceType: string;
    currentTreatmentStatus: string;
    currentStartDate?: Date;
    currentReturnWeeks?: number;
    isFirstAttendance: boolean;
    isLoading?: boolean;
    onComplete?: (createdTreatmentIds: number[]) => void;
  }) => void;
  openEndOfDay: (data: {
    selectedDate?: string;
  }) => void;
  openViewCompletedConsultation: (data: {
    attendanceId: number;
    patientId: number;
    patientName: string;
  }) => void;
  openUnresolvedPast: (dates: Array<{ date: string; count: number; statuses: string[] }>) => void;
  closeModal: (modalName: keyof Pick<ModalStore, 'cancellation' | 'postTreatment' | 'multiSection' | 'assessmentBeforeTreatmentConfirm' | 'newPatientCheckIn' | 'postAttendance' | 'endOfDay' | 'viewCompletedConsultation' | 'unresolvedPast'>) => void;
  setCancellationLoading: (loading: boolean) => void;
  setPostTreatmentSummaries: (summaries: ModalTreatmentSummary[]) => void;
  setPostTreatmentLoading: (loading: boolean) => void;
  setPostAttendanceLoading: (loading: boolean) => void;
}

export const useModalStore = create<ModalStore>()(
  immer((set) => ({
    // Initial state
    cancellation: {
      isOpen: false,
      isLoading: false,
    },

    postTreatment: {
      isOpen: false,
      attendanceId: undefined,
      attendanceIds: undefined,
      patientId: undefined,
      patientName: undefined,
      attendanceType: undefined,
      treatmentSummaries: [],
      isLoadingTreatmentSummaries: false,
    },

    multiSection: {
      isOpen: false,
    },

    assessmentBeforeTreatmentConfirm: {
      isOpen: false,
    },

    newPatientCheckIn: {
      isOpen: false,
    },

    postAttendance: {
      isOpen: false,
    },

    endOfDay: {
      isOpen: false,
      selectedDate: undefined,
    },

    viewCompletedConsultation: {
      isOpen: false,
      attendanceId: undefined,
      patientId: undefined,
      patientName: undefined,
    },

    unresolvedPast: {
      isOpen: false,
      dates: [],
    },

    // Actions
    openCancellation: (attendanceIds, patientName, attendanceDate) => {
      set((state) => {
        state.cancellation.attendanceIds = attendanceIds;
        state.cancellation.patientName = patientName;
        state.cancellation.attendanceDate = attendanceDate;
        state.cancellation.isOpen = true;
        state.cancellation.isLoading = false;
      });
    },

    openMultiSection: (onConfirm, onCancel) => {
      set((state) => {
        state.multiSection.isOpen = true;
        state.multiSection.onConfirm = onConfirm;
        state.multiSection.onCancel = onCancel;
      });
    },

    openAssessmentBeforeTreatmentConfirm: (onConfirm, onCancel) => {
      set((state) => {
        state.assessmentBeforeTreatmentConfirm.isOpen = true;
        state.assessmentBeforeTreatmentConfirm.onConfirm = onConfirm;
        state.assessmentBeforeTreatmentConfirm.onCancel = onCancel;
      });
    },

    openNewPatientCheckIn: ({ patient, attendanceId, onComplete }) => {
      set((state) => {
        state.newPatientCheckIn.isOpen = true;
        state.newPatientCheckIn.patient = patient;
        state.newPatientCheckIn.attendanceId = attendanceId;
        state.newPatientCheckIn.onComplete = onComplete;
      });
    },

    openPostTreatment: (data) => {
      set((state) => {
        state.postTreatment.isOpen = true;
        state.postTreatment.attendanceIds = data.attendanceIds;
        state.postTreatment.patientId = data.patientId;
        state.postTreatment.patientName = data.patientName;
        state.postTreatment.attendanceType = data.attendanceType;
        state.postTreatment.treatmentSummaries = [];
        state.postTreatment.isLoadingTreatmentSummaries = false;
        state.postTreatment.onComplete = data.onComplete;
      });
    },
    openPostAttendance: (data) => {
      set((state) => {
        state.postAttendance.isOpen = true;
        state.postAttendance.attendanceId = data.attendanceId;
        state.postAttendance.patientId = data.patientId;
        state.postAttendance.patientName = data.patientName;
        state.postAttendance.attendanceType = data.attendanceType;
        state.postAttendance.currentTreatmentStatus = data.currentTreatmentStatus;
        state.postAttendance.currentStartDate = data.currentStartDate;
        state.postAttendance.currentReturnWeeks = data.currentReturnWeeks;
        state.postAttendance.isFirstAttendance = data.isFirstAttendance;
        state.postAttendance.isLoading = data.isLoading || false;
        state.postAttendance.onComplete = data.onComplete;
      });
    },

    openEndOfDay: (data) => {
      set((state) => {
        state.endOfDay.isOpen = true;
        state.endOfDay.selectedDate = data.selectedDate;
      });
    },

    openViewCompletedConsultation: (data) => {
      set((state) => {
        state.viewCompletedConsultation.isOpen = true;
        state.viewCompletedConsultation.attendanceId = data.attendanceId;
        state.viewCompletedConsultation.patientId = data.patientId;
        state.viewCompletedConsultation.patientName = data.patientName;
      });
    },

    closeModal: (modalName) => {
      set((state) => {
        state[modalName].isOpen = false;

        // Reset modal-specific data
        if (modalName === 'cancellation') {
          state.cancellation.isLoading = false;
          state.cancellation.attendanceIds = undefined;
          state.cancellation.patientName = undefined;
          state.cancellation.attendanceDate = undefined;
        }
        if (modalName === 'postTreatment') {
          state.postTreatment.attendanceId = undefined;
          state.postTreatment.attendanceIds = undefined;
          state.postTreatment.patientId = undefined;
          state.postTreatment.patientName = undefined;
          state.postTreatment.attendanceType = undefined;
          state.postTreatment.treatmentSummaries = [];
          state.postTreatment.isLoadingTreatmentSummaries = false;
          state.postTreatment.onComplete = undefined;
        }
        if (modalName === 'multiSection') {
          state.multiSection.onConfirm = undefined;
          state.multiSection.onCancel = undefined;
        }
        if (modalName === 'assessmentBeforeTreatmentConfirm') {
          state.assessmentBeforeTreatmentConfirm.onConfirm = undefined;
          state.assessmentBeforeTreatmentConfirm.onCancel = undefined;
        }
        if (modalName === 'newPatientCheckIn') {
          state.newPatientCheckIn.patient = undefined;
          state.newPatientCheckIn.attendanceId = undefined;
          state.newPatientCheckIn.onComplete = undefined;
        }
        if (modalName === 'postAttendance') {
          state.postAttendance.attendanceId = undefined;
          state.postAttendance.patientId = undefined;
          state.postAttendance.patientName = undefined;
          state.postAttendance.attendanceType = undefined;
          state.postAttendance.currentTreatmentStatus = undefined;
          state.postAttendance.currentStartDate = undefined;
          state.postAttendance.currentReturnWeeks = undefined;
          state.postAttendance.isFirstAttendance = undefined;
          state.postAttendance.isLoading = undefined;
          state.postAttendance.onComplete = undefined;
        }
        if (modalName === 'endOfDay') {
          state.endOfDay.selectedDate = undefined;
        }
        if (modalName === 'viewCompletedConsultation') {
          state.viewCompletedConsultation.attendanceId = undefined;
          state.viewCompletedConsultation.patientId = undefined;
          state.viewCompletedConsultation.patientName = undefined;
        }
        if (modalName === 'unresolvedPast') {
          state.unresolvedPast.dates = [];
        }
      });
    },

    openUnresolvedPast: (dates) => {
      set((state) => {
        state.unresolvedPast.isOpen = true;
        state.unresolvedPast.dates = dates;
      });
    },

    setCancellationLoading: (loading) => {
      set((state) => {
        state.cancellation.isLoading = loading;
      });
    },

    setPostTreatmentSummaries: (summaries) => {
      set((state) => {
        state.postTreatment.treatmentSummaries = summaries;
      });
    },

    setPostTreatmentLoading: (loading) => {
      set((state) => {
        state.postTreatment.isLoadingTreatmentSummaries = loading;
      });
    },

    setPostAttendanceLoading: (loading) => {
      set((state) => {
        state.postAttendance.isLoading = loading;
      });
    },
  }))
);

// Selector hooks
export const useCancellationModal = () => useModalStore((state) => state.cancellation);
export const usePostTreatmentModal = () => useModalStore((state) => state.postTreatment);
export const useMultiSectionModal = () => useModalStore((state) => state.multiSection);
export const useAssessmentBeforeTreatmentConfirmModal = () => useModalStore((state) => state.assessmentBeforeTreatmentConfirm);
export const useNewPatientCheckInModal = () => useModalStore((state) => state.newPatientCheckIn);
export const usePostAttendanceModal = () => useModalStore((state) => state.postAttendance);
export const useEndOfDayModal = () => useModalStore((state) => state.endOfDay);
export const useViewCompletedConsultationModal = () => useModalStore((state) => state.viewCompletedConsultation);
export const useUnresolvedPastModal = () => useModalStore((state) => state.unresolvedPast);

// Action hooks
export const useOpenCancellation = () => useModalStore((state) => state.openCancellation);
export const useOpenMultiSection = () => useModalStore((state) => state.openMultiSection);
export const useOpenAssessmentBeforeTreatmentConfirm = () => useModalStore((state) => state.openAssessmentBeforeTreatmentConfirm);
export const useOpenPostTreatment = () => useModalStore((state) => state.openPostTreatment);
export const useOpenNewPatientCheckIn = () => useModalStore((state) => state.openNewPatientCheckIn);
export const useOpenPostAttendance = () => useModalStore((state) => state.openPostAttendance);
export const useOpenEndOfDay = () => useModalStore((state) => state.openEndOfDay);
export const useOpenViewCompletedConsultation = () => useModalStore((state) => state.openViewCompletedConsultation);
export const useOpenUnresolvedPast = () => useModalStore((state) => state.openUnresolvedPast);
export const useCloseModal = () => useModalStore((state) => state.closeModal);
export const useSetCancellationLoading = () => useModalStore((state) => state.setCancellationLoading);
export const useSetPostTreatmentSummaries = () => useModalStore((state) => state.setPostTreatmentSummaries);
export const useSetPostTreatmentLoading = () => useModalStore((state) => state.setPostTreatmentLoading);
export const useSetPostAttendanceLoading = () => useModalStore((state) => state.setPostAttendanceLoading);