/**
 * Attendance modal registry exports.
 *
 * Modal implementations stay with their owning workflow folder; this entry
 * point only collects the modals that participate in the board registry.
 */

export { default as ModalRegistry } from './ModalRegistry';
export { default as EndOfDayModal } from '../EndOfDay/EndOfDayModal';
export { default as MultiSectionModal } from '../Board/MultiSectionModal';
export { default as AssessmentBeforeTreatmentConfirmModal } from '../Board/AssessmentBeforeTreatmentConfirmModal';
export { default as NewPatientCheckInModal } from '../WalkIn/NewPatientCheckInModal';
export { default as PostAttendanceModal } from '../Consultation/PostAttendanceModal';
export { default as PostTreatmentModal } from '../TreatmentSession/PostTreatmentModal';
export { default as ViewCompletedConsultationModal } from '../Consultation/ViewCompletedConsultationModal';

// Re-export types and utilities
export { getRegisteredModals } from './ModalRegistry';
export type { ModalRegistryEntry } from './ModalRegistry';

export { ManageAttendanceModal } from '../AttendanceActions/ManageAttendanceModal';
export { default as UnresolvedPastAttendancesModal } from '../AttendanceActions/UnresolvedPastAttendancesModal';