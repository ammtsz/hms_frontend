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
  { id: PATIENT_PAGE_SECTION_IDS.header, label: "Perfil", iconName: "User" },
  { id: PATIENT_PAGE_SECTION_IDS.notes, label: "Anotações", iconName: "StickyNote" },
  {
    id: PATIENT_PAGE_SECTION_IDS.currentTreatment,
    label: "Resumo",
    iconName: "ClipboardList",
  },
  {
    id: PATIENT_PAGE_SECTION_IDS.sessionBreakdown,
    label: "Tratamentos",
    iconName: "Activity",
  },
  {
    id: PATIENT_PAGE_SECTION_IDS.attendanceHistory,
    label: "Histórico",
    iconName: "History",
  },
  {
    id: PATIENT_PAGE_SECTION_IDS.scheduledAttendances,
    label: "Agendamentos",
    iconName: "CalendarDays",
  },
];
