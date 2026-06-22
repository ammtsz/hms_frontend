/**
 * Section IDs must match the id attributes on the patient detail page.
 * Used by PatientPageSectionNav for scroll targets and by the page for section wrappers.
 */
/**
 * Scroll margin for section anchors when jumping via the desktop section rail (`lg+`).
 * Omit on small screens — mobile FAB scroll does not need extra top offset.
 */
export const PATIENT_PAGE_SECTION_SCROLL_MARGIN_CLASS = "lg:scroll-mt-[100px]";

export const PATIENT_PAGE_SECTION_IDS = {
  header: "patient-section-header",
  notes: "patient-section-notes",
  currentTreatment: "patient-section-current-treatment",
  sessionBreakdown: "patient-section-session-breakdown",
  attendanceHistory: "patient-section-attendance-history",
  scheduledAttendances: "patient-section-scheduled-attendances",
} as const;

export type PatientPageSectionId =
  (typeof PATIENT_PAGE_SECTION_IDS)[keyof typeof PATIENT_PAGE_SECTION_IDS];

export const PATIENT_PAGE_SECTIONS: ReadonlyArray<{
  id: PatientPageSectionId;
  label: string;
  iconName: "User" | "StickyNote" | "Activity" | "ClipboardList" | "History" | "CalendarDays";
}> = [
  { id: PATIENT_PAGE_SECTION_IDS.header, label: "Profile", iconName: "User" },
  { id: PATIENT_PAGE_SECTION_IDS.notes, label: "Notes", iconName: "StickyNote" },
  {
    id: PATIENT_PAGE_SECTION_IDS.currentTreatment,
    label: "Summary",
    iconName: "ClipboardList",
  },
  {
    id: PATIENT_PAGE_SECTION_IDS.sessionBreakdown,
    label: "Treatments",
    iconName: "Activity",
  },
  {
    id: PATIENT_PAGE_SECTION_IDS.attendanceHistory,
    label: "History",
    iconName: "History",
  },
  {
    id: PATIENT_PAGE_SECTION_IDS.scheduledAttendances,
    label: "Appointments",
    iconName: "CalendarDays",
  },
];
