import React from "react";
import LoadingFallback from "@/components/common/LoadingFallback";

// Lazy load patient detail components for code splitting
export const LazyHeaderCard = React.lazy(() =>
  import("@/features/patients/detail/HeaderCard").then((module) => ({
    default: module.HeaderCard,
  })),
);

export const LazyCurrentTreatmentCard = React.lazy(() =>
  import("@/features/patients/detail/CurrentTreatmentCard").then((module) => ({
    default: module.CurrentTreatmentCard,
  })),
);

export const LazyAttendanceHistoryCard = React.lazy(() =>
  import("@/features/patients/detail/AttendanceHistory/AttendanceHistoryCard").then((module) => ({
    default: module.AttendanceHistoryCard,
  })),
);

export const LazyScheduledAttendancesCard = React.lazy(() =>
  import("@/features/patients/detail/ScheduledAttendances/ScheduledAttendancesCard").then((module) => ({
    default: module.ScheduledAttendancesCard,
  })),
);

export const LazyPatientNotesCard = React.lazy(() =>
  import("@/features/patients/detail/PatientNotesCard").then((module) => ({
    default: module.PatientNotesCard,
  })),
);

export const LazySessionBreakdownCard = React.lazy(() =>
  import("@/features/patients/detail/SessionBreakdown").then((module) => ({
    default: module.SessionBreakdownCard,
  })),
);

// Reusable Suspense wrapper with patient-specific loading state
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyComponentWrapper({
  children,
  fallback = (
    <LoadingFallback size="medium" message="Carregando componente..." />
  ),
}: LazyComponentWrapperProps) {
  return <React.Suspense fallback={fallback}>{children}</React.Suspense>;
}
