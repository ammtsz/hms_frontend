"use client";

import React, { Suspense, lazy } from "react";
import LoadingFallback from "@/components/common/LoadingFallback";

// Lazy load the ScheduleCalendar component
const ScheduleCalendar = lazy(() => import("@/features/schedule"));

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <LoadingFallback message="Loading schedule calendar..." size="large" />
      }
    >
      <ScheduleCalendar />
    </Suspense>
  );
}
