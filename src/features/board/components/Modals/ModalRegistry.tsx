import React from "react";

const LazyManageAppointmentsModal = React.lazy(
  () => import("@/features/board/components/AppointmentActions/ManageAppointmentsModal"),
);
const LazyMultiSectionModal = React.lazy(
  () => import("@/features/board/components/Board/MultiSectionModal"),
);
const LazyAssessmentBeforeTreatmentConfirmModal = React.lazy(
  () => import("@/features/board/components/Board/AssessmentBeforeTreatmentConfirmModal"),
);
const LazyNewPatientCheckInModal = React.lazy(
  () => import("@/features/board/components/WalkIn/NewPatientCheckInModal"),
);
const LazyPostConsultationModal = React.lazy(
  () => import("@/features/board/components/Consultation/PostConsultationModal"),
);
const LazyEndOfDayModal = React.lazy(
  () => import("@/features/board/components/EndOfDay/EndOfDayModal"),
);
const LazyPostTreatmentModal = React.lazy(
  () => import("@/features/board/components/TreatmentSession/PostTreatmentModal"),
);
const LazyViewCompletedConsultationModal = React.lazy(
  () => import("@/features/board/components/Consultation/ViewCompletedConsultationModal"),
);
const LazyUnresolvedPastAppointmentsModal = React.lazy(
  () => import("@/features/board/components/AppointmentActions/UnresolvedPastAppointmentsModal"),
);

/**
 * Modal Registry - Single component that renders all Zustand-managed modals
 *
 * Benefits:
 * - Zero prop drilling
 * - Single import in AppointmentsBoard
 * - Easy to add new modals (just add to this registry)
 * - Automatic lazy loading and performance optimization
 * - Centralized modal management
 */

interface ModalRegistryProps {
  onRefresh?: () => void;
}

const MODAL_REGISTRY = [
  {
    name: "manageAppointment",
    component: LazyManageAppointmentsModal,
    description: "Handles appointment cancellation or postponement",
  },
  {
    name: "multiSection",
    component: LazyMultiSectionModal,
    description: "Handles drag-drop operations affecting multiple sections",
  },
  {
    name: "assessmentBeforeTreatmentConfirm",
    component: LazyAssessmentBeforeTreatmentConfirmModal,
    description:
      "Confirm moving assessment to onGoing when treatments not completed",
  },
  {
    name: "newPatientCheckIn",
    component: LazyNewPatientCheckInModal,
    description: "New patient registration and check-in workflow",
  },
  {
    name: "postConsultation",
    component: LazyPostConsultationModal,
    description: "Assessment treatment form for completed appointments",
  },
  {
    name: "endOfDay",
    component: LazyEndOfDayModal,
    description: "End of day finalization and absence justification",
  },
  {
    name: "postTreatment",
    component: LazyPostTreatmentModal,
    description: "Modal for recording post-treatment details",
  },
  {
    name: "viewCompletedConsultation",
    component: LazyViewCompletedConsultationModal,
    description: "View completed assessment consultation details",
  },
  {
    name: "unresolvedPast",
    component: LazyUnresolvedPastAppointmentsModal,
    description: "Alert for unresolved past appointments",
  },
];

/**
 * ModalRegistry Component
 *
 * Automatically renders all registered modals. Each modal manages its own
 * visibility through Zustand store state.
 *
 * @param onRefresh - Optional callback to refresh data after modal operations
 */
const ModalRegistry: React.FC<ModalRegistryProps> = ({ onRefresh }) => {
  return (
    <>
      {MODAL_REGISTRY.map(({ name, component: ModalComponent }) => {
        // Pass onRefresh to ManageAppointmentsModal
        if (name === "manageAppointment") {
          return <ModalComponent key={name} onRefresh={onRefresh} />;
        }
        return <ModalComponent key={name} />;
      })}
    </>
  );
};

/**
 * Helper function to get modal information for debugging
 */
export const getRegisteredModals = () => {
  return MODAL_REGISTRY.map(({ name, description }) => ({
    name,
    description,
  }));
};

/**
 * Type for adding new modals to registry
 */
export type ModalRegistryEntry = {
  name: string;
  component: React.ComponentType;
  description: string;
};

// Export both named and default for compatibility
export { ModalRegistry };
export default ModalRegistry;
