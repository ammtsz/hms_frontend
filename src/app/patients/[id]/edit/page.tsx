"use client";

import React from "react";
import { useParams } from "next/navigation";
import PatientEditPage from "@/features/patients/edit";

export default function EditPatientRoute() {
  const params = useParams();
  const patientId = params.id as string;

  return <PatientEditPage patientId={patientId} />;
}
