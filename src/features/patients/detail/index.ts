// Main component
export { AppointmentHistoryCard } from "./AppointmentHistory/AppointmentHistoryCard";

// Sub-components (exported for testing and potential reuse)
export { AppointmentHistoryHeader } from "./AppointmentHistory/AppointmentHistoryHeader";
export { StatusFilterButtons } from "./AppointmentHistory/StatusFilterButtons";
export { AppointmentHistoryItem } from "./AppointmentHistory/AppointmentHistoryItem";
export { AbsenceNote } from "./AppointmentHistory/AbsenceNote";

// Hook
export { useAppointmentHistory } from "./AppointmentHistory/hooks/useAppointmentHistory";
export type { StatusFilter } from "./AppointmentHistory/hooks/useAppointmentHistory";

// Utils
export {
  getStatusConfig,
  getTreatmentTypeLabel,
} from "./AppointmentHistory/utils";
export type { AppointmentStatus, StatusConfig } from "./AppointmentHistory/utils";
