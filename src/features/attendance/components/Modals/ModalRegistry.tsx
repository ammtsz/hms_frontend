import React from "react";

const LazyManageAttendanceModal = React.lazy(
  () => import("@/features/attendance/components/AttendanceActions/ManageAttendanceModal"),
);
const LazyMultiSectionModal = React.lazy(
  () => import("@/features/attendance/components/Board/MultiSectionModal"),
);
const LazyAssessmentBeforeTreatmentConfirmModal = React.lazy(
  () => import("@/features/attendance/components/Board/AssessmentBeforeTreatmentConfirmModal"),
);
const LazyNewPatientCheckInModal = React.lazy(
  () => import("@/features/attendance/components/WalkIn/NewPatientCheckInModal"),
);
const LazyPostAttendanceModal = React.lazy(
  () => import("@/features/attendance/components/Consultation/PostAttendanceModal"),
);
const LazyEndOfDayModal = React.lazy(
  () => import("@/features/attendance/components/EndOfDay/EndOfDayModal"),
);
const LazyPostTreatmentModal = React.lazy(
  () => import("@/features/attendance/components/TreatmentSession/PostTreatmentModal"),
);
const LazyViewCompletedConsultationModal = React.lazy(
  () => import("@/features/attendance/components/Consultation/ViewCompletedConsultationModal"),
);
const LazyUnresolvedPastAttendancesModal = React.lazy(
  () => import("@/features/attendance/components/AttendanceActions/UnresolvedPastAttendancesModal"),
);

/**
 * Modal Registry - Single component that renders all Zustand-managed modals
 *
 * Benefits:
 * - Zero prop drilling
 * - Single import in AttendanceBoard
 * - Easy to add new modals (just add to this registry)
 * - Automatic lazy loading and performance optimization
 * - Centralized modal management
 */

interface ModalRegistryProps {
  onRefresh?: () => void;
}

const MODAL_REGISTRY = [
  {
    name: "manageAttendance",
    component: LazyManageAttendanceModal,
    description: "Handles attendance cancellation or postponement",
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
    name: "postAttendance",
    component: LazyPostAttendanceModal,
    description: "Assessment treatment form for completed attendances",
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
    component: LazyUnresolvedPastAttendancesModal,
    description: "Alert for unresolved past attendances",
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
        // Pass onRefresh to ManageAttendanceModal
        if (name === "manageAttendance") {
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
