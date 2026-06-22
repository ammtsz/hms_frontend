"use client";

import React, { Suspense, lazy } from "react";
import LoadingFallback from "@/components/common/LoadingFallback";

const HolidayManagement = lazy(() => import("@/features/holidays"));

export default function HolidaysPage() {
  return (
    <Suspense
      fallback={
        <LoadingFallback message="Loading holiday management..." size="large" />
      }
    >
      <HolidayManagement />
    </Suspense>
  );
}
