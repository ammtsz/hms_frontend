"use client";

import React, { Suspense, lazy } from "react";
import LoadingFallback from "@/components/common/LoadingFallback";

// Lazy load the AgendaCalendar component
const AgendaCalendar = lazy(() => import("@/features/agenda"));

export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <LoadingFallback message="Loading agenda calendar..." size="large" />
      }
    >
      <AgendaCalendar />
    </Suspense>
  );
}
