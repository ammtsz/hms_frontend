export const SYSTEM_SETTINGS_MIN_THRESHOLD = 1;
export const SYSTEM_SETTINGS_MAX_THRESHOLD = 10;

export const SYSTEM_SETTINGS_LABELS = {
  pageTitle: "⚙️ System Settings",
  pageDescription: "Manage system options",
  missingAppointmentsThreshold: "Missing Appointments Threshold",
  priorities: "Priorities",
  noteCategories: "Note Categories",
  bodyLocations: "Body Locations",
  configUpdatedToast: "Configuration updated successfully.",
  adminOnlyThreshold: "Only administrators can change this value.",
  thresholdValidation: `Please enter a value between ${SYSTEM_SETTINGS_MIN_THRESHOLD} and ${SYSTEM_SETTINGS_MAX_THRESHOLD}.`,
} as const;
