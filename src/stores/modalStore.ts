import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AppointmentType, PatientBasic } from '@/types/types';

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
    appointmentIds?: number[];
    patientName?: string;
    /** Appointment date (YYYY-MM-DD) used as base when rescheduling by weeks */
    appointmentDate?: string;
    isLoading: boolean;
  };

  // Treatment completion modal state
  postTreatment: {
    isOpen: boolean;
    /** Single appointment (legacy) or all appointment IDs for this completion (grouped card) */
    appointmentId?: number;
    appointmentIds?: number[];
    patientId?: number;
    patientName?: string;
    appointmentType?: AppointmentType;
    treatmentSummaries: ModalTreatmentSummary[];
    isLoadingTreatmentSummaries: boolean;
    /** Called with list of appointment IDs that were completed (not cancelled) */
    onComplete?: (completedAppointmentIds: number[]) => void;
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
    appointmentId?: number;
    onComplete?: (success: boolean) => void;
  };

  // Treatment Form modal state
  postConsultation: {
    isOpen: boolean;
    appointmentId?: number;
    patientId?: number;
    patientName?: string;
    appointmentType?: string;
    currentTreatmentStatus?: string;
    currentStartDate?: Date;
    currentReturnWeeks?: number;
    isFirstAppointment?: boolean;
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
    appointmentId?: number;
    patientId?: number;
    patientName?: string;
  };

  // Unresolved past appointments alert
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
    appointmentIds: number[],
    patientName: string,
    appointmentDate?: string,
  ) => void;
  openMultiSection: (onConfirm: () => void, onCancel: () => void) => void;
  openAssessmentBeforeTreatmentConfirm: (onConfirm: () => void, onCancel: () => void) => void;
  openNewPatientCheckIn: (data: {
    patient: PatientBasic,
    appointmentId?: number,
    onComplete?: (success: boolean) => void
  }) => void;
  openPostTreatment: (data: {
    /** All appointment IDs for this completion (one for single card, multiple for grouped) */
    appointmentIds: number[];
    patientId: number;
    patientName: string;
    appointmentType: AppointmentType;
    onComplete?: (completedAppointmentIds: number[]) => void;
  }) => void;
  openPostConsultation: (data: {
    appointmentId: number;
    patientId: number;
    patientName: string;
    appointmentType: string;
    currentTreatmentStatus: string;
    currentStartDate?: Date;
    currentReturnWeeks?: number;
    isFirstAppointment: boolean;
    isLoading?: boolean;
    onComplete?: (createdTreatmentIds: number[]) => void;
  }) => void;
  openEndOfDay: (data: {
    selectedDate?: string;
  }) => void;
  openViewCompletedConsultation: (data: {
    appointmentId: number;
    patientId: number;
    patientName: string;
  }) => void;
  openUnresolvedPast: (dates: Array<{ date: string; count: number; statuses: string[] }>) => void;
  closeModal: (modalName: keyof Pick<ModalStore, 'cancellation' | 'postTreatment' | 'multiSection' | 'assessmentBeforeTreatmentConfirm' | 'newPatientCheckIn' | 'postConsultation' | 'endOfDay' | 'viewCompletedConsultation' | 'unresolvedPast'>) => void;
  setCancellationLoading: (loading: boolean) => void;
  setPostTreatmentSummaries: (summaries: ModalTreatmentSummary[]) => void;
  setPostTreatmentLoading: (loading: boolean) => void;
  setPostConsultationLoading: (loading: boolean) => void;
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
      appointmentId: undefined,
      appointmentIds: undefined,
      patientId: undefined,
      patientName: undefined,
      appointmentType: undefined,
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

    postConsultation: {
      isOpen: false,
    },

    endOfDay: {
      isOpen: false,
      selectedDate: undefined,
    },

    viewCompletedConsultation: {
      isOpen: false,
      appointmentId: undefined,
      patientId: undefined,
      patientName: undefined,
    },

    unresolvedPast: {
      isOpen: false,
      dates: [],
    },

    // Actions
    openCancellation: (appointmentIds, patientName, appointmentDate) => {
      set((state) => {
        state.cancellation.appointmentIds = appointmentIds;
        state.cancellation.patientName = patientName;
        state.cancellation.appointmentDate = appointmentDate;
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

    openNewPatientCheckIn: ({ patient, appointmentId, onComplete }) => {
      set((state) => {
        state.newPatientCheckIn.isOpen = true;
        state.newPatientCheckIn.patient = patient;
        state.newPatientCheckIn.appointmentId = appointmentId;
        state.newPatientCheckIn.onComplete = onComplete;
      });
    },

    openPostTreatment: (data) => {
      set((state) => {
        state.postTreatment.isOpen = true;
        state.postTreatment.appointmentIds = data.appointmentIds;
        state.postTreatment.patientId = data.patientId;
        state.postTreatment.patientName = data.patientName;
        state.postTreatment.appointmentType = data.appointmentType;
        state.postTreatment.treatmentSummaries = [];
        state.postTreatment.isLoadingTreatmentSummaries = false;
        state.postTreatment.onComplete = data.onComplete;
      });
    },
    openPostConsultation: (data) => {
      set((state) => {
        state.postConsultation.isOpen = true;
        state.postConsultation.appointmentId = data.appointmentId;
        state.postConsultation.patientId = data.patientId;
        state.postConsultation.patientName = data.patientName;
        state.postConsultation.appointmentType = data.appointmentType;
        state.postConsultation.currentTreatmentStatus = data.currentTreatmentStatus;
        state.postConsultation.currentStartDate = data.currentStartDate;
        state.postConsultation.currentReturnWeeks = data.currentReturnWeeks;
        state.postConsultation.isFirstAppointment = data.isFirstAppointment;
        state.postConsultation.isLoading = data.isLoading || false;
        state.postConsultation.onComplete = data.onComplete;
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
        state.viewCompletedConsultation.appointmentId = data.appointmentId;
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
          state.cancellation.appointmentIds = undefined;
          state.cancellation.patientName = undefined;
          state.cancellation.appointmentDate = undefined;
        }
        if (modalName === 'postTreatment') {
          state.postTreatment.appointmentId = undefined;
          state.postTreatment.appointmentIds = undefined;
          state.postTreatment.patientId = undefined;
          state.postTreatment.patientName = undefined;
          state.postTreatment.appointmentType = undefined;
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
          state.newPatientCheckIn.appointmentId = undefined;
          state.newPatientCheckIn.onComplete = undefined;
        }
        if (modalName === 'postConsultation') {
          state.postConsultation.appointmentId = undefined;
          state.postConsultation.patientId = undefined;
          state.postConsultation.patientName = undefined;
          state.postConsultation.appointmentType = undefined;
          state.postConsultation.currentTreatmentStatus = undefined;
          state.postConsultation.currentStartDate = undefined;
          state.postConsultation.currentReturnWeeks = undefined;
          state.postConsultation.isFirstAppointment = undefined;
          state.postConsultation.isLoading = undefined;
          state.postConsultation.onComplete = undefined;
        }
        if (modalName === 'endOfDay') {
          state.endOfDay.selectedDate = undefined;
        }
        if (modalName === 'viewCompletedConsultation') {
          state.viewCompletedConsultation.appointmentId = undefined;
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

    setPostConsultationLoading: (loading) => {
      set((state) => {
        state.postConsultation.isLoading = loading;
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
export const usePostConsultationModal = () => useModalStore((state) => state.postConsultation);
export const useEndOfDayModal = () => useModalStore((state) => state.endOfDay);
export const useViewCompletedConsultationModal = () => useModalStore((state) => state.viewCompletedConsultation);
export const useUnresolvedPastModal = () => useModalStore((state) => state.unresolvedPast);

// Action hooks
export const useOpenCancellation = () => useModalStore((state) => state.openCancellation);
export const useOpenMultiSection = () => useModalStore((state) => state.openMultiSection);
export const useOpenAssessmentBeforeTreatmentConfirm = () => useModalStore((state) => state.openAssessmentBeforeTreatmentConfirm);
export const useOpenPostTreatment = () => useModalStore((state) => state.openPostTreatment);
export const useOpenNewPatientCheckIn = () => useModalStore((state) => state.openNewPatientCheckIn);
export const useOpenPostAppointment = () => useModalStore((state) => state.openPostConsultation);
export const useOpenEndOfDay = () => useModalStore((state) => state.openEndOfDay);
export const useOpenViewCompletedConsultation = () => useModalStore((state) => state.openViewCompletedConsultation);
export const useOpenUnresolvedPast = () => useModalStore((state) => state.openUnresolvedPast);
export const useCloseModal = () => useModalStore((state) => state.closeModal);
export const useSetCancellationLoading = () => useModalStore((state) => state.setCancellationLoading);
export const useSetPostTreatmentSummaries = () => useModalStore((state) => state.setPostTreatmentSummaries);
export const useSetPostTreatmentLoading = () => useModalStore((state) => state.setPostTreatmentLoading);
export const useSetPostAppointmentLoading = () => useModalStore((state) => state.setPostConsultationLoading);