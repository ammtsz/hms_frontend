"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PatientBasic } from "@/types/types";

export interface PatientListCardProps {
  patient: PatientBasic;
  statusLegend: Record<string, string>;
  priorityLegend: Record<string, string>;
}

export function PatientListCard({
  patient,
  statusLegend,
  priorityLegend,
}: PatientListCardProps) {
  const statusLabel = statusLegend[patient.status] ?? patient.status;
  const priorityLabel =
    priorityLegend[patient.priority] ?? String(patient.priority);

  return (
    <Link
      href={`/patients/${patient.id}`}
      className="flex min-h-[44px] items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
      data-testid={`patient-card-${patient.id}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{patient.name}</p>
        <p className="mt-1 text-sm text-gray-600">{patient.phone}</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <div className="min-w-0">
            <dt className="text-gray-500">Status</dt>
            <dd className="truncate font-medium text-gray-800">
              {statusLabel}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-gray-500">Priority</dt>
            <dd className="truncate font-medium text-gray-800">
              {priorityLabel}
            </dd>
          </div>
        </dl>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
    </Link>
  );
}
