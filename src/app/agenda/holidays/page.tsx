"use client";

import React, { Suspense, lazy } from "react";
import LoadingFallback from "@/components/common/LoadingFallback";

const HolidayManagement = lazy(() => import("@/features/holidays"));

export default function HolidaysPage() {
  return (
    <Suspense
      fallback={
        <LoadingFallback
          message="Carregando gerenciamento de feriados..."
          size="large"
        />
      }
    >
      <HolidayManagement />
    </Suspense>
  );
}
