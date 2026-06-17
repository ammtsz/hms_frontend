"use client";

import React from "react";
import { Calendar, CalendarDays, Edit2, Trash2 } from "lucide-react";
import { HolidayGroup } from "@/utils/holidayGrouping";
import { Holiday } from "@/types/holiday";
import { IconButton } from "@/components/ui";

const TREATMENT_TYPE_LABELS = {
  assessment: "Consulta de Avaliação",
  physiotherapy: "Fisioterapia",
  tens: "TENS",
} as const;

export interface HolidayListCardProps {
  group: HolidayGroup;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
}

function getBlockedTreatmentTypes(group: HolidayGroup): string {
  const blockedTypes = group.holidays[0].blockedTreatmentTypes;

  if (!blockedTypes || blockedTypes.length === 0) {
    return "Consulta de Avaliação, Fisioterapia, TENS";
  }

  return blockedTypes
    .map(
      (type) =>
        TREATMENT_TYPE_LABELS[type as keyof typeof TREATMENT_TYPE_LABELS] ||
        type,
    )
    .join(", ");
}

export function HolidayListCard({
  group,
  onEdit,
  onDelete,
}: HolidayListCardProps) {
  const handleEdit = () => {
    onEdit(group.holidays[0]);
  };

  const handleDelete = () => {
    onDelete(group.holidays[0]);
  };

  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-4"
      data-testid={`holiday-card-${group.groupId ?? group.holidays[0].id}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{group.dateRange}</p>
          <h3 className="mt-1 break-words text-base font-semibold text-gray-900">
            {group.displayName}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            onClick={handleEdit}
            tone="primary"
            title={group.isPeriod ? "Editar período" : "Editar"}
            aria-label={group.isPeriod ? "Editar período" : "Editar"}
          >
            <Edit2 className="h-4 w-4" />
          </IconButton>
          <IconButton
            onClick={handleDelete}
            tone="danger"
            title={group.isPeriod ? "Excluir período" : "Excluir"}
            aria-label={group.isPeriod ? "Excluir período" : "Excluir"}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Descrição</dt>
          <dd className="break-words text-gray-800">
            {group.description || "—"}
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {group.isPeriod ? (
            <CalendarDays className="h-4 w-4 text-blue-600" aria-hidden />
          ) : (
            <Calendar className="h-4 w-4 text-gray-600" aria-hidden />
          )}
          <dd className="font-medium text-gray-800">
            {group.isPeriod ? `${group.holidays.length} dias` : "1 dia"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Folga</dt>
          <dd className="break-words text-gray-800">
            {getBlockedTreatmentTypes(group)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
