// Main component
export { AttendanceHistoryCard } from "./AttendanceHistory/AttendanceHistoryCard";

// Sub-components (exported for testing and potential reuse)
export { AttendanceHistoryHeader } from "./AttendanceHistory/AttendanceHistoryHeader";
export { StatusFilterButtons } from "./AttendanceHistory/StatusFilterButtons";
export { AttendanceHistoryItem } from "./AttendanceHistory/AttendanceHistoryItem";
export { AbsenceNote } from "./AttendanceHistory/AbsenceNote";

// Hook
export { useAttendanceHistory } from "./AttendanceHistory/hooks/useAttendanceHistory";
export type { StatusFilter } from "./AttendanceHistory/hooks/useAttendanceHistory";

// Utils
export {
  getStatusConfig,
  getTreatmentTypeLabel,
} from "./AttendanceHistory/utils";
export type { AttendanceStatus, StatusConfig } from "./AttendanceHistory/utils";
