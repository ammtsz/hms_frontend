"use client";

import React from "react";
import { Calendar, CalendarDays, Edit2, Trash2 } from "lucide-react";
import { HolidayGroup } from "@/utils/holidayGrouping";
import { Holiday } from "@/types/holiday";
import { IconButton } from "@/components/ui";
import { formatBlockedTreatmentTypes } from "../utils/holidayDisplayUtils";

export interface HolidayListCardProps {
  group: HolidayGroup;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
}

function getBlockedTreatmentTypes(group: HolidayGroup): string {
  return formatBlockedTreatmentTypes(group.holidays[0].blockedTreatmentTypes);
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
            title={group.isPeriod ? "Edit period" : "Edit"}
            aria-label={group.isPeriod ? "Edit period" : "Edit"}
          >
            <Edit2 className="h-4 w-4" />
          </IconButton>
          <IconButton
            onClick={handleDelete}
            tone="danger"
            title={group.isPeriod ? "Delete period" : "Delete"}
            aria-label={group.isPeriod ? "Delete period" : "Delete"}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Description</dt>
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
            {group.isPeriod ? `${group.holidays.length} days` : "1 day"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Blocked treatments</dt>
          <dd className="break-words text-gray-800">
            {getBlockedTreatmentTypes(group)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
