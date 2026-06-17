"use client";

import React from "react";
import Link from "next/link";
import { PatientResponseDto } from "@/api/types";
import { Patient } from "@/types/types";

interface QuickActionsProps {
  patient: PatientResponseDto | Patient;
}

export default function QuickActions({ patient }: QuickActionsProps) {
  return (
    <div className="w-full shrink-0 sm:w-auto lg:w-auto">
      <Link
        href={`/patients/${patient.id}/edit`}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md border-2 border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-800 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto lg:min-h-0"
      >
        Editar
      </Link>
    </div>
  );
}
