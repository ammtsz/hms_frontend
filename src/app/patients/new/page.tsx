"use client";

import React, { Suspense, lazy } from "react";
import Breadcrumb from "@/components/common/Breadcrumb";
import LoadingFallback from "@/components/common/LoadingFallback";

// Lazy load the PatientForm component
const PatientForm = lazy(() => import("@/features/patients/form"));

export default function NewPatientPage() {
  const breadcrumbItems = [
    { label: "Pacientes", href: "/patients" },
    { label: "Cadastro de Paciente", isActive: true },
  ];

  return (
    <div className="flex flex-col gap-8 my-6 sm:my-16">
      <div className="max-w-4xl mx-auto w-full px-4">
        <Breadcrumb items={breadcrumbItems} />
        <Suspense
          fallback={
            <LoadingFallback
              message="Carregando formulário de cadastro..."
              size="medium"
            />
          }
        >
          <PatientForm />
        </Suspense>
      </div>
    </div>
  );
}
