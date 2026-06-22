"use client";

import React, { Suspense, lazy } from "react";

// Lazy load the PatientList component
const PatientList = lazy(() => import("@/features/patients/list"));

export default function PatientsPage() {
  return (
    <div className="flex flex-col gap-8 my-6 sm:my-16">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading patients...</div>
          </div>
        }
      >
        <PatientList />
      </Suspense>
    </div>
  );
}
