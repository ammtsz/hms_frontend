import { AttendanceType } from "@/types/types";
import { getAttendanceTypeLabel } from "@/utils/apiTransformers";

export const HOLIDAY_LIST_EMPTY_STATE = {
  title: "No holidays registered",
  description: "Add holidays to block dates in the calendar",
  button: "Add First Holiday",
} as const;

export const HOLIDAY_LIST_TABLE_HEADERS = {
  dates: "Date(s)",
  name: "Name",
  description: "Description",
  duration: "Duration",
  dayOff: "Day Off",
  actions: "Actions",
} as const;

const HOLIDAY_BLOCKED_TREATMENT_TYPES: AttendanceType[] = [
  "assessment",
  "physiotherapy",
  "tens",
];

export const HOLIDAY_TREATMENT_TYPE_OPTIONS = HOLIDAY_BLOCKED_TREATMENT_TYPES.map(
  (value) => ({
    value,
    label: getAttendanceTypeLabel(value),
  }),
);

/** Comma-separated blocked treatment labels; defaults to all types when unset. */
export function formatBlockedTreatmentTypes(
  blockedTypes?: string[] | null,
): string {
  if (!blockedTypes || blockedTypes.length === 0) {
    return HOLIDAY_BLOCKED_TREATMENT_TYPES.map(getAttendanceTypeLabel).join(
      ", ",
    );
  }

  return blockedTypes
    .map((type) => {
      if (
        type === "assessment" ||
        type === "physiotherapy" ||
        type === "tens"
      ) {
        return getAttendanceTypeLabel(type);
      }
      return type;
    })
    .join(", ");
}
